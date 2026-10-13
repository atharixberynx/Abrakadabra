/**
 * Crea (o promueve) la primera cuenta de administración.
 *
 *   npm run seed:admin                  → crea la cuenta con ADMIN_EMAIL y ADMIN_PASSWORD del .env
 *   npm run seed:admin -- --reset       → además restablece la contraseña si la cuenta ya existe
 *
 * Es la ÚNICA forma de crear un admin: el registro público siempre crea clientas.
 */
import { env } from '../src/config/env.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { hashPassword } from '../src/services/authService.js';
import { emailField, passwordField } from '../src/validators/auth.validators.js';

const resetPassword = process.argv.includes('--reset');

const email = emailField.safeParse(env.ADMIN_EMAIL ?? '');
const password = passwordField.safeParse(env.ADMIN_PASSWORD ?? '');

if (!email.success || !password.success) {
  console.error('\n❌ Revisa ADMIN_EMAIL y ADMIN_PASSWORD en server/.env:');
  if (!email.success) console.error(`  - ADMIN_EMAIL: ${email.error.issues[0].message}`);
  if (!password.success) console.error(`  - ADMIN_PASSWORD: ${password.error.issues[0].message}`);
  process.exit(1);
}

try {
  await connectDB(env.MONGODB_URI);

  const existing = await User.findOne({ email: email.data });

  if (!existing) {
    await User.create({
      name: 'Administración Abrakadabra',
      email: email.data,
      passwordHash: await hashPassword(password.data),
      role: 'admin',
    });
    console.log(`\n✔ Cuenta de administración creada: ${email.data}\n`);
  } else {
    existing.role = 'admin';
    if (resetPassword) existing.passwordHash = await hashPassword(password.data);
    await existing.save();
    console.log(
      `\n✔ ${email.data} ya existía; ahora tiene rol admin` +
        (resetPassword ? ' y la contraseña fue restablecida.\n' : '.\n') +
        (resetPassword ? '' : '  (Usa `npm run seed:admin -- --reset` para restablecer la contraseña.)\n'),
    );
  }
} catch (err) {
  console.error('\n❌ No se pudo crear la cuenta de administración:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
