"use client";
import React from "react";
import { useAdminEmployees } from "@/hooks/useAdminEmployees";
import BottomNav from "@/components/BottomNav";
import EmployeeHeader from "./components/EmployeeHeader";
import EmployeeSearchHeader from "./components/EmployeeSearchHeader";
import EmployeePagination from "./components/EmployeePagination";
import EmployeeList from "./components/EmployeeList";
import AddEmployeeModal from "./components/AddEmployeeModal";
import EditEmployeeModal from "./components/EditEmployeeModal";
import GeofencingTab from "./components/GeofencingTab";
import AttendanceTab from "./components/AttendanceTab";
import { CheckCircle } from "@phosphor-icons/react";

export default function AdminEmployeesPage() {
  const {
    activeTab,
    setActiveTab,
    users,
    page,
    setPage,
    totalPages,
    totalUsers,
    hasNextPage,
    hasPrevPage,
    isPlaceholderData,
    isLoading,
    isError,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
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
    isDeleting,
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
    isSavingGeofence,
    // Attendance
    attendanceRecords,
    handleDeleteAttendance,
  } = useAdminEmployees();

  return (
    <div className="page-root">
      <div className="page-content">
        <EmployeeHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onRefresh={refetch}
        />

        <main style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Toast Notification */}
          {toastMessage && (
            <div
              style={{
                backgroundColor: "var(--ink-primary)",
                color: "#ffffff",
                padding: "10px 14px",
                borderRadius: "var(--r-md)",
                fontSize: "12px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.15)",
                animation: "slideUp 0.2s ease",
              }}
            >
              <CheckCircle size={18} color="#52b788" weight="fill" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* TAB 1: KARYAWAN & ACCESS KEYS */}
          {activeTab === "employees" && (
            <>
              {/* Search & Actions Header */}
              <EmployeeSearchHeader
                totalUsers={totalUsers}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenAddModal={() => setShowAddModal(true)}
              />

              {/* Pagination directly below search */}
              <EmployeePagination
                page={page}
                totalPages={totalPages}
                totalUsers={totalUsers}
                limit={4}
                hasPrevPage={hasPrevPage}
                hasNextPage={hasNextPage}
                onPageChange={setPage}
                isPlaceholderData={isPlaceholderData}
              />

              {/* Staff List */}
              <EmployeeList
                users={users}
                isLoading={isLoading}
                isError={isError}
                error={error}
                copiedId={copiedId}
                onCopyKey={copyToClipboard}
                onRegenerateKey={handleRegenerateKey}
                onToggleStatus={handleToggleStatus}
                onEdit={setEditingUser}
                onDelete={handleDelete}
                isDeleting={isDeleting}
                onRetry={refetch}
              />
            </>
          )}

          {/* TAB 2: GEOFENCING SETTINGS */}
          {activeTab === "geofencing" && (
            <GeofencingTab
              geoEnabled={geoEnabled}
              setGeoEnabled={setGeoEnabled}
              geoAddress={geoAddress}
              setGeoAddress={setGeoAddress}
              geoLat={geoLat}
              setGeoLat={setGeoLat}
              geoLng={geoLng}
              setGeoLng={setGeoLng}
              geoRadius={geoRadius}
              setGeoRadius={setGeoRadius}
              isGettingGps={isGettingGps}
              onGetCurrentGps={handleGetCurrentGps}
              onSaveGeofencing={handleSaveGeofencing}
              isSavingGeofence={isSavingGeofence}
            />
          )}

          {/* TAB 3: ATTENDANCE HISTORY */}
          {activeTab === "attendance" && (
            <AttendanceTab
              attendanceRecords={attendanceRecords}
              onDeleteAttendance={handleDeleteAttendance}
            />
          )}
        </main>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <AddEmployeeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(newKey, id, name) => {
            copyToClipboard(newKey, id);
            showToast(`Karyawan "${name}" berhasil dibuat & kunci disalin!`);
          }}
          onError={showToast}
        />
      )}

      {/* Edit Employee Modal */}
      {editingUser && (
        <EditEmployeeModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={(name) => {
            showToast(`Data karyawan "${name}" berhasil diperbarui!`);
          }}
          onError={showToast}
        />
      )}

      <BottomNav role="admin" />
    </div>
  );
}
