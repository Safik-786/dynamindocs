import bcrypt from "bcryptjs";
import * as authRepository from "../repositories/auth.repository";

export const registerUser = async (data) => {
  const existingUser = await authRepository.findUserByEmail(data.email);
  if (existingUser) {
    const error = new Error("User with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);

  const newUser = await authRepository.createUser({
    name: data.name,
    email: data.email,
    passwordHash,
  });

  // Remove password hash from returned object
  const { passwordHash: _, hashedRefreshToken, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};
