"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ProtectedRoute from "@/components/layouts/ProtectedRoute";
import { useSession } from "next-auth/react";
import { 
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
  Checkbox,
  Divider,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  Snackbar,
  Alert
} from "@mui/material";
import CustomHeading from "@/components/ui/CustomHeading";
import { useRbacData, useUpdateRolePermission } from "@/modules/rbac/hooks";

export default function RBACPage() {
  const { data: session, status } = useSession();
  
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const { data, error, isLoading } = useRbacData({
    enabled: status === "authenticated" && session?.user?.roles?.includes("ADMIN"),
  });

  const { mutate: updatePermission } = useUpdateRolePermission();

  useEffect(() => {
    if (data?.roles && data.roles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(data.roles[0].id);
    }
  }, [data, selectedRoleId]);

  const handleRoleSelect = (roleId) => {
    setSelectedRoleId(roleId);
  };

  const handlePermissionToggle = async (permissionId, isGranted) => {
    if (!selectedRoleId) return;
    
    const role = data.roles.find(r => r.id === selectedRoleId);
    if (!role) return;

    // We can potentially prevent changing permissions for the system ADMIN role if needed.
    // For now, allow it or trust the user.

    const action = isGranted ? 'revoke' : 'grant';
    
    updatePermission(
      { roleId: selectedRoleId, permissionId, action },
      {
        onSuccess: () => {
          setToast({ open: true, message: "Permission updated successfully", severity: "success" });
        },
        onError: () => {
          setToast({ open: true, message: "Failed to update permission", severity: "error" });
        }
      }
    );
  };

  const closeToast = () => setToast({ ...toast, open: false });

  const selectedRole = data?.roles?.find(r => r.id === selectedRoleId);

  // Group permissions by module
  const permissionsByModule = data?.permissions?.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {}) || {};

  return (
    <ProtectedRoute requiredRoles={["ADMIN"]}>
      <DashboardLayout>
        <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col">
        <CustomHeading 
          className="mb-6 shrink-0"
          title="Role-Based Access Control" 
          subtitle="Manage roles and their associated permissions" 
        />

        {error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
            Failed to load RBAC data. Please try again.
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <CircularProgress />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
            {/* Left Side: Roles List */}
            <Paper className="w-full md:w-1/3 lg:w-1/4 rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <Typography variant="h6" className="text-slate-700 font-semibold text-base">
                  Roles
                </Typography>
              </div>
              <List className="flex-1 overflow-y-auto p-0">
                {data?.roles?.map((role, index) => (
                  <div key={role.id}>
                    {index > 0 && <Divider />}
                    <ListItem disablePadding>
                      <ListItemButton
                        selected={selectedRoleId === role.id}
                        onClick={() => handleRoleSelect(role.id)}
                        className={`py-3 ${selectedRoleId === role.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                      >
                        <ListItemText 
                          primary={role.name}
                          secondary={role.description || role.code}
                          primaryTypographyProps={{ 
                            className: `font-medium ${selectedRoleId === role.id ? 'text-primary' : 'text-slate-700'}`
                          }}
                          secondaryTypographyProps={{ 
                            className: "text-xs text-slate-500 line-clamp-1"
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  </div>
                ))}
              </List>
            </Paper>

            {/* Right Side: Permissions Matrix */}
            <Paper className="w-full md:w-2/3 lg:w-3/4 rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-0">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 shrink-0">
                <Typography variant="h6" className="text-slate-800 font-bold">
                  {selectedRole ? `${selectedRole.name} Permissions` : 'Select a role'}
                </Typography>
                {selectedRole && (
                  <Typography variant="body2" className="text-slate-500 mt-1">
                    {selectedRole.description}
                  </Typography>
                )}
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-[#F9FBFD]">
                {selectedRole ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {Object.entries(permissionsByModule).map(([module, permissions]) => (
                      <Card key={module} className="shadow-sm border border-slate-200 rounded-xl overflow-visible">
                        <CardHeader 
                          title={module} 
                          titleTypographyProps={{ className: "text-sm font-bold text-slate-700 tracking-wider" }}
                          className="bg-slate-50/50 border-b border-slate-100 py-3 px-4"
                        />
                        <CardContent className="p-0">
                          <List disablePadding>
                            {permissions.map((perm, idx) => {
                              const isGranted = selectedRole.permissions.includes(perm.code);
                              const isSystemAdmin = selectedRole.code === 'ADMIN';
                              
                              return (
                                <div key={perm.id}>
                                  {idx > 0 && <Divider className="border-slate-100" />}
                                  <ListItem className="px-4 py-2 hover:bg-slate-50/50 transition-colors">
                                    <FormControlLabel
                                      className="w-full m-0"
                                      control={
                                        <Checkbox
                                          checked={isGranted}
                                          onChange={() => handlePermissionToggle(perm.id, isGranted)}
                                          disabled={isSystemAdmin} // Optional: prevent editing Admin role permissions
                                          color="primary"
                                          size="small"
                                          className={isSystemAdmin ? "text-slate-300" : ""}
                                        />
                                      }
                                      label={
                                        <div className="ml-2">
                                          <Typography variant="body2" className={`font-medium ${isGranted ? 'text-slate-800' : 'text-slate-600'}`}>
                                            {perm.name}
                                          </Typography>
                                          {perm.description && (
                                            <Typography variant="caption" className="text-slate-500 block">
                                              {perm.description}
                                            </Typography>
                                          )}
                                        </div>
                                      }
                                    />
                                  </ListItem>
                                </div>
                              );
                            })}
                          </List>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 italic">
                    Select a role from the left to view permissions
                  </div>
                )}
              </div>
            </Paper>
          </div>
        )}
      </div>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={closeToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={closeToast} severity={toast.severity} sx={{ width: '100%' }} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
    </ProtectedRoute>
  );
}
