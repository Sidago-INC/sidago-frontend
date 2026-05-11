// ============================================================================
// MOCK USERS — DEPRECATED (kept for reference only)
// ============================================================================
// Up through the mock-auth phase, this file backed /api/auth/login,
// /api/auth/me, and /api/auth/refresh. As of the real-auth rollout (Phase D
// of the auth migration), all three routes query the `users` table in
// Supabase and verify bcrypt password hashes — nothing here is read at
// runtime anymore.
//
// The 9 entries below correspond exactly to the rows seeded by migration
// 004_seed_data.sql + bcrypt hashes set in 021_seed_real_users.sql, so this
// list still serves as a quick reference for "who can log in with 123456."
//
// Safe to delete entirely once we're confident no path needs it again. Keep
// commented out for now in case we want to restore mock auth for an offline
// demo or test fixture.
// ============================================================================
//
//
// export type MockUser = {
//   id: string;
//   name: string;
//   email: string;
//   password: string;
//   role: UserRole;
//   accessToken: string;
//   refreshToken: string;
// };
//
// export const users: readonly MockUser[] = [
//   { id: "1", name: "Mariz",   email: "mariz@gmail.com",   password: "123456", role: "agent",      accessToken: "access-token-1", refreshToken: "refresh-token-1" },
//   { id: "2", name: "Tom",     email: "tom@gmail.com",     password: "123456", role: "agent",      accessToken: "access-token-2", refreshToken: "refresh-token-2" },
//   { id: "3", name: "Chris",   email: "chris@gmail.com",   password: "123456", role: "agent",      accessToken: "access-token-3", refreshToken: "refresh-token-3" },
//   { id: "4", name: "Bryan",   email: "bryan@gmail.com",   password: "123456", role: "agent",      accessToken: "access-token-4", refreshToken: "refresh-token-4" },
//   { id: "5", name: "Ryan",    email: "ryan@gmail.com",    password: "123456", role: "admin",      accessToken: "access-token-5", refreshToken: "refresh-token-5" },
//   { id: "6", name: "Matin",   email: "matin@gmail.com",   password: "123456", role: "admin",      accessToken: "access-token-6", refreshToken: "refresh-token-6" },
//   { id: "7", name: "Tauseef", email: "tauseef@gmail.com", password: "123456", role: "backoffice", accessToken: "access-token-7", refreshToken: "refresh-token-7" },
//   { id: "8", name: "Shanto",  email: "shanto@gmail.com",  password: "123456", role: "backoffice", accessToken: "access-token-8", refreshToken: "refresh-token-8" },
//   { id: "9", name: "Adil",    email: "adil@gmail.com",    password: "123456", role: "admin",      accessToken: "access-token-9", refreshToken: "refresh-token-9" },
// ] as const;

import { UserRole } from "../navigation";
export type MockUser = {
  id: string;
  name: string;
  surname?: string;
  email: string;
  password: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
};

export const users: readonly MockUser[] = [
  {
    id: "1",
    name: "Mariz",
    surname: "Cabido",
    email: "mariz@gmail.com",
    password: "123456",
    role: "agent",
    accessToken: "access-token-1",
    refreshToken: "refresh-token-1",
  },
  {
    id: "2",
    name: "Tom",
    surname: "Silver",
    email: "tom@gmail.com",
    password: "123456",
    role: "agent",
    accessToken: "access-token-2",
    refreshToken: "refresh-token-2",
  },
  {
    id: "3",
    name: "Chris",
    surname: "Moore",
    email: "chris@gmail.com",
    password: "123456",
    role: "agent",
    accessToken: "access-token-3",
    refreshToken: "refresh-token-3",
  },
  {
    id: "4",
    name: "Bryan",
    surname: "Taylor",
    email: "bryan@gmail.com",
    password: "123456",
    role: "agent",
    accessToken: "access-token-4",
    refreshToken: "refresh-token-4",
  },
  {
    id: "5",
    name: "Ryan",
    email: "ryan@gmail.com",
    password: "123456",
    role: "admin",
    accessToken: "access-token-5",
    refreshToken: "refresh-token-5",
  },
  {
    id: "6",
    name: "Matin",
    email: "matin@gmail.com",
    password: "123456",
    role: "admin",
    accessToken: "access-token-6",
    refreshToken: "refresh-token-6",
  },
  {
    id: "7",
    name: "Tauseef",
    email: "tauseef@gmail.com",
    password: "123456",
    role: "backoffice",
    accessToken: "access-token-7",
    refreshToken: "refresh-token-7",
  },
  {
    id: "8",
    name: "Shanto",
    email: "shanto@gmail.com",
    password: "123456",
    role: "backoffice",
    accessToken: "access-token-8",
    refreshToken: "refresh-token-8",
  },
  {
    id: "9",
    name: "Adil",
    email: "adil@gmail.com",
    password: "123456",
    role: "admin",
    accessToken: "access-token-9",
    refreshToken: "refresh-token-9",
  },
] as const;
