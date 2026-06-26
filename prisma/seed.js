const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Define Permissions
  const permissionsData = [
    { name: 'Create User', code: 'USER.CREATE', module: 'USER' },
    { name: 'Update User', code: 'USER.UPDATE', module: 'USER' },
    { name: 'Delete User', code: 'USER.DELETE', module: 'USER' },
    { name: 'Create Document', code: 'DOCUMENT.CREATE', module: 'DOCUMENT' },
    { name: 'Edit Document', code: 'DOCUMENT.EDIT', module: 'DOCUMENT' },
    { name: 'View Document', code: 'DOCUMENT.VIEW', module: 'DOCUMENT' },
    { name: 'Manage Roles', code: 'ROLE.MANAGE', module: 'SYSTEM' },
  ];

  console.log('Seeding permissions...');
  const permissions = {};
  for (const perm of permissionsData) {
    const created = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
    permissions[perm.code] = created;
  }

  // 2. Define Roles
  const rolesData = [
    {
      name: 'System Administrator',
      code: 'ADMIN',
      description: 'Full access to the system',
      isSystem: true,
      permissions: Object.values(permissions), // Admin gets all permissions
    },
    {
      name: 'Document Editor',
      code: 'EDITOR',
      description: 'Can create and edit documents',
      isSystem: true,
      permissions: [
        permissions['DOCUMENT.CREATE'],
        permissions['DOCUMENT.EDIT'],
        permissions['DOCUMENT.VIEW'],
      ],
    },
    {
      name: 'Document Viewer',
      code: 'VIEWER',
      description: 'Can only view documents',
      isSystem: true,
      permissions: [
        permissions['DOCUMENT.VIEW'],
      ],
    },
  ];

  console.log('Seeding roles...');
  const roles = {};
  for (const r of rolesData) {
    const roleData = {
      name: r.name,
      code: r.code,
      description: r.description,
      isSystem: r.isSystem,
    };

    const createdRole = await prisma.rbacRole.upsert({
      where: { code: r.code },
      update: roleData,
      create: roleData,
    });
    
    roles[r.code] = createdRole;

    // Seed Role Permissions
    for (const perm of r.permissions) {
      if (!perm) continue; // Skip if perm not found
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: createdRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: createdRole.id,
          permissionId: perm.id,
        },
      });
    }
  }

  // 3. Create Users for each role
  console.log('Seeding users...');
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const usersData = [
    {
      email: 'admin@dynamicdocs.com',
      name: 'Admin User',
      roleCode: 'ADMIN',
    },
    {
      email: 'editor@dynamicdocs.com',
      name: 'Editor User',
      roleCode: 'EDITOR',
    },
    {
      email: 'viewer@dynamicdocs.com',
      name: 'Viewer User',
      roleCode: 'VIEWER',
    },
  ];

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        isVerified: true,
      },
    });

    // Assign role to user
    const role = roles[u.roleCode];
    if (role) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: role.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: role.id,
        },
      });
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
