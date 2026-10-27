-- Permissão para editar dados básicos e anonimizar clientes (LGPD).
INSERT INTO "Permission" ("id", "key", "description")
SELECT 'perm_customers_manage', 'customers.manage', 'Editar e anonimizar clientes'
WHERE NOT EXISTS (
    SELECT 1 FROM "Permission" WHERE "key" = 'customers.manage'
);

-- Concede a permissão aos papéis administrativos já existentes. Em bancos
-- novos os papéis ainda não existem aqui; o seed cria a mesma associação.
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role_row."id", permission_row."id"
FROM "Role" AS role_row
JOIN "Permission" AS permission_row ON permission_row."key" = 'customers.manage'
WHERE role_row."name" IN ('ADMIN', 'MANAGER')
  AND NOT EXISTS (
    SELECT 1
    FROM "RolePermission" AS existing
    WHERE existing."roleId" = role_row."id"
      AND existing."permissionId" = permission_row."id"
  );
