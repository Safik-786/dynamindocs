"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextField, Button, Typography, Alert, Box, IconButton, InputAdornment } from "@mui/material";
import Link from "next/link";
import { ArrowBack as ArrowBackIcon, Visibility, VisibilityOff } from "@mui/icons-material";
import CustomHeading from "@/components/ui/CustomHeading";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      router.push("/login?registered=true");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-gradient-mesh relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <Box className="w-full max-w-md p-8 sm:p-12 glass-panel rounded-3xl relative z-10 m-4 animate-fade-in-up border border-white/40 shadow-2xl">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-primary transition-colors mb-6 text-sm font-medium">
          <ArrowBackIcon fontSize="small" className="mr-1" /> Back to home
        </Link>
        
        <CustomHeading 
          title="Create Account" 
          subtitle="Join DDOCS and start collaborating." 
          className="mb-8" 
        />

        {error && <Alert severity="error" className="mb-6 rounded-xl">{error}</Alert>}

        <form onSubmit={handleSubmit} className="flex mt-5 flex-col gap-5">
          <TextField
            label="Full Name"
            type="text"
            variant="outlined"
            size="small"
            fullWidth
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
              }
            }}
          />
          <TextField
            label="Email"
            type="email"
            variant="outlined"
            size="small"
            fullWidth
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
              }
            }}
          />
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            size="small"
            fullWidth
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
              }
            }}
          />
          
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            size="large" 
            fullWidth
            disabled={loading}
            className="mt-4 py-3 text-lg shadow-lg shadow-primary/30 bg-primary hover:bg-primary-hover"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:text-primary-hover font-semibold transition-colors">
            Log in
          </Link>
        </div>
      </Box>
    </div>
  );
}
