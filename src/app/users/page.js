"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ProtectedRoute from "@/components/layouts/ProtectedRoute";
import { useSession } from "next-auth/react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Pagination, 
  TextField,
  Chip,
  CircularProgress
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { format } from "date-fns";
import CustomHeading from "@/components/ui/CustomHeading";
import { useUsers } from "@/modules/users/hooks";

export default function UsersPage() {
  const { data: session, status } = useSession();
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to first page on search change
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, error, isLoading } = useUsers({
    page,
    limit,
    debouncedSearch,
    enabled: status === "authenticated" && session?.user?.roles?.includes("ADMIN"),
  });


  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <ProtectedRoute requiredRoles={["ADMIN"]}>
      <DashboardLayout>
        <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <CustomHeading 
            title="User Management" 
            subtitle="Manage system users and their access levels" 
          />
          
          <div className="relative w-full sm:w-auto">
            <TextField
              placeholder="Search users..."
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon className="text-slate-400 mr-2" />,
                className: "bg-white"
              }}
              className="w-full sm:w-64 shadow-sm"
            />
          </div>
        </div>

        {error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
            Failed to load users. Please try again.
          </div>
        ) : (
          <TableContainer component={Paper} className="shadow-md rounded-xl border border-slate-200 overflow-hidden">
            <Table sx={{ minWidth: 650 }} aria-label="users table">
              <TableHead className="bg-slate-50">
                <TableRow>
                  <TableCell className="font-semibold text-slate-600">Name</TableCell>
                  <TableCell className="font-semibold text-slate-600">Email</TableCell>
                  <TableCell className="font-semibold text-slate-600">Roles</TableCell>
                  <TableCell className="font-semibold text-slate-600">Status</TableCell>
                  <TableCell className="font-semibold text-slate-600">Joined</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" className="py-12">
                      <CircularProgress size={30} className="text-primary" />
                    </TableCell>
                  </TableRow>
                ) : data?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" className="py-8 text-slate-500">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data?.map((user) => (
                    <TableRow
                      key={user.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <TableCell className="font-medium text-slate-800">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-slate-600">{user.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.map((roleName) => (
                            <Chip 
                              key={roleName} 
                              label={roleName} 
                              size="small" 
                              className={
                                roleName === "System Administrator" 
                                  ? "bg-purple-100 text-purple-700 font-medium" 
                                  : "bg-blue-100 text-blue-700 font-medium"
                              }
                            />
                          ))}
                          {user.roles.length === 0 && (
                            <span className="text-xs text-slate-400 italic">No roles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.isVerified ? (
                          <Chip label="Verified" size="small" color="success" className="bg-green-100 text-green-700 font-medium border-0" />
                        ) : (
                          <Chip label="Unverified" size="small" className="bg-amber-100 text-amber-700 font-medium border-0" />
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {format(new Date(user.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {data?.meta && data.meta.totalPages > 1 && (
              <div className="p-4 flex justify-center border-t border-slate-200 bg-white">
                <Pagination 
                  count={data.meta.totalPages} 
                  page={page} 
                  onChange={handlePageChange} 
                  color="primary"
                  className="[&_.MuiPaginationItem-root]:text-slate-600"
                />
              </div>
            )}
          </TableContainer>
        )}
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  );
}
