"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TextField, Button, Typography, Alert, Box, IconButton, InputAdornment } from "@mui/material";
import Link from "next/link";
import { ArrowBack as ArrowBackIcon, Visibility, VisibilityOff } from "@mui/icons-material";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-gradient-mesh relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <Box className="w-full max-w-md p-8 sm:p-12 glass-panel rounded-3xl relative z-10 m-4 animate-fade-in-up border border-white/40 shadow-2xl">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-primary transition-colors mb-6 text-sm font-medium">
          <ArrowBackIcon fontSize="small" className="mr-1" /> Back to home
        </Link>
        
        <Typography variant="h4" component="h1" className="font-extrabold text-slate-900 mb-2">
          Welcome back
        </Typography>
        <Typography variant="body1" className="text-slate-500 mb-8">
          Enter your details to access your workspace.
        </Typography>

        {error && <Alert severity="error" className="mb-6 rounded-xl">{error}</Alert>}

        <form onSubmit={handleSubmit} className="flex mt-5 flex-col gap-5">
          <TextField
            label="Email"
            type="email"
            variant="outlined"
            size="small"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-600">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary hover:text-primary-hover font-semibold transition-colors">
            Sign up
          </Link>
        </div>
      </Box>
    </div>
  );
}
