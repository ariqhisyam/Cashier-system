import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, generateEmployeeKey } from "@/lib/store";
import type { User, OutletLocation } from "@/lib/types";
import { getCurrentPositionAsync } from "@/lib/geo";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "./useUsers";
import { useGeofence, useUpdateGeofence } from "./useGeofence";

const PAGE_SIZE = 4;

export type AdminStaffTab = "employees" | "geofencing" | "attendance";

export function useAdminEmployees() {
  const { state, dispatch } = useStore();
  const router = useRouter();

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminStaffTab>("employees");

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Actions
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Backend Geofence Query & Mutation
  const { data: geofenceData, isLoading: isLoadingGeofence } = useGeofence();
  const updateGeofenceMutation = useUpdateGeofence();

  // Geofencing form state
  const [geoEnabled, setGeoEnabled] = useState(true);
  const [geoAddress, setGeoAddress] = useState("Outlet 4rq Cashier - Pontianak");
  const [geoLat, setGeoLat] = useState("-0.026330");
  const [geoLng, setGeoLng] = useState("109.342503");
  const [geoRadius, setGeoRadius] = useState(100);
  const [isGettingGps, setIsGettingGps] = useState(false);

  // Sync geofencing state from backend data
  useEffect(() => {
    if (geofenceData) {
      setGeoEnabled(geofenceData.isEnabled);
      setGeoAddress(geofenceData.addressName || "Outlet 4rq Cashier - Pontianak");
      setGeoLat(String(geofenceData.latitude));
      setGeoLng(String(geofenceData.longitude));
      setGeoRadius(geofenceData.radiusMeters);
      dispatch({
        type: "SET_OUTLET_LOCATION",
        payload: geofenceData,
      });
    }
  }, [geofenceData, dispatch]);

  // Handle search change & reset page
  function handleSearchChange(query: string) {
    setSearchQuery(query);
    setPage(1);
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }

  function copyToClipboard(text: string, id: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    showToast(`Kunci akses "${text}" berhasil disalin!`);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // React Query fetch
  const {
    data: usersData,
    isLoading,
    isError,
    error,
    refetch,
    isPlaceholderData,
  } = useUsers(
    {
      page,
      limit: PAGE_SIZE,
      search: searchQuery,
      sortBy: "createdAt",
      sortOrder: "desc",
    }
  );

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const users = usersData?.users || [];
  const meta = usersData?.meta || {
    total: users.length,
    page,
    limit: PAGE_SIZE,
    totalPages: 1,
  };

  // Toggle active status
  async function handleToggleStatus(user: User) {
    try {
      const newStatus = !user.isActive;
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: { isActive: newStatus },
      });
      showToast(
        `Status ${user.name} diubah menjadi ${newStatus ? "Aktif" : "Nonaktif"}.`
      );
    } catch (err: any) {
      showToast(`Gagal mengubah status: ${err.message}`);
    }
  }

  // Regenerate key
  async function handleRegenerateKey(user: User) {
    const newKey = generateEmployeeKey();
    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        data: { key: newKey },
      });
      copyToClipboard(newKey, user.id);
      showToast(`Kunci baru "${newKey}" untuk ${user.name} berhasil dibuat & disalin!`);
    } catch (err: any) {
      showToast(`Gagal memperbarui kunci: ${err.message}`);
    }
  }

  // Delete user
  function handleDelete(id: string, name: string) {
    if (confirm(`Yakin ingin menghapus akses staff "${name}"?`)) {
      deleteUserMutation.mutate(id, {
        onSuccess: () => {
          showToast(`Karyawan "${name}" berhasil dihapus.`);
          if (users.length === 1 && page > 1) {
            setPage((prev) => prev - 1);
          }
        },
        onError: (err: any) => {
          showToast(`Gagal menghapus: ${err.message}`);
        },
      });
    }
  }

  // Geofencing actions
  async function handleGetCurrentGps() {
    setIsGettingGps(true);
    try {
      const coords = await getCurrentPositionAsync();
      setGeoLat(coords.latitude.toFixed(6));
      setGeoLng(coords.longitude.toFixed(6));
      showToast(
        `📍 Koordinat GPS perangkat Anda berhasil diambil (Akurasi: ±${Math.round(
          coords.accuracy
        )}m)`
      );
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Gagal mengambil lokasi GPS.";
      showToast(`⚠️ ${msg}`);
    } finally {
      setIsGettingGps(false);
    }
  }

  async function handleSaveGeofencing() {
    const lat = parseFloat(geoLat);
    const lng = parseFloat(geoLng);
    if (isNaN(lat) || isNaN(lng)) {
      showToast("⚠️ Format Latitude atau Longitude tidak valid.");
      return;
    }
    const updatedLocation: OutletLocation = {
      latitude: lat,
      longitude: lng,
      radiusMeters: geoRadius,
      isEnabled: geoEnabled,
      addressName: geoAddress.trim() || "Outlet 4rq Cashier",
    };

    try {
      await updateGeofenceMutation.mutateAsync(updatedLocation);
      dispatch({ type: "SET_OUTLET_LOCATION", payload: updatedLocation });
      showToast("✅ Pengaturan Lokasi Outlet & Geofencing berhasil disimpan ke backend!");
    } catch (err: any) {
      showToast(`⚠️ Gagal menyimpan geofencing: ${err.message}`);
    }
  }

  function handleDeleteAttendance(id: string) {
    if (confirm("Hapus catatan presensi ini?")) {
      dispatch({ type: "DELETE_ATTENDANCE_RECORD", payload: id });
      showToast("Catatan presensi dihapus.");
    }
  }

  return {
    isAuthorized: state.session === "admin",
    activeTab,
    setActiveTab,
    users,
    meta,
    page,
    setPage,
    totalPages: meta.totalPages,
    totalUsers: meta.total,
    hasNextPage: page < meta.totalPages,
    hasPrevPage: page > 1,
    isPlaceholderData,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    searchQuery,
    setSearchQuery: handleSearchChange,
    showAddModal,
    setShowAddModal,
    editingUser,
    setEditingUser,
    copiedId,
    toastMessage,
    showToast,
    copyToClipboard,
    handleToggleStatus,
    handleRegenerateKey,
    handleDelete,
    isDeleting: deleteUserMutation.isPending,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
    // Geofencing
    geoEnabled,
    setGeoEnabled,
    geoAddress,
    setGeoAddress,
    geoLat,
    setGeoLat,
    geoLng,
    setGeoLng,
    geoRadius,
    setGeoRadius,
    isGettingGps,
    handleGetCurrentGps,
    handleSaveGeofencing,
    isSavingGeofence: updateGeofenceMutation.isPending,
    isLoadingGeofence,
    // Attendance
    attendanceRecords: state.attendanceRecords || [],
    handleDeleteAttendance,
  };
}
