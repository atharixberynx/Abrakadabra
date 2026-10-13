/**
 * Mi cuenta: "Mis pedidos", datos personales y cambio de contraseña.
 */
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { PasswordField } from '../../components/ui/PasswordField.jsx';
import { StarIcon } from '../../components/ui/StarIcon.jsx';
import { TextField } from '../../components/ui/TextField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { apiFetch } from '../../lib/api.js';
import { formatPrice } from '../../lib/format.js';
import { formatDate } from '../../lib/orders.js';
import { StatusBadge } from '../OrderPage.jsx';
import { applyApiErrors } from '../../lib/forms.js';
import { changePasswordSchema, profileSchema } from '../../schemas/auth.js';

function Section({ title, children }) {
  return (
    <section className="rounded-card border border-lavender bg-white p-5 shadow-soft sm:p-6">
      <h2 className="mb-5 text-xl text-brand-dark">{title}</h2>
      {children}
    </section>
  );
}

const pieces = (order) => order.items.reduce((n, i) => n + i.quantity, 0);

function MyOrders() {
  const { data, loading, error, reload } = useFetch('/orders/mine', { cache: false });
  const orders = data?.orders ?? [];

  if (loading) return <p className="py-4 text-center text-sm text-ink/70">Cargando tus pedidos…</p>;
  if (error) {
    return (
      <p className="py-4 text-center text-sm text-ink/80">
        {error.message}{' '}
        <button type="button" onClick={reload} className="font-medium text-brand underline">Reintentar</button>
      </p>
    );
  }
  if (orders.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-ink/80">Todavía no tienes pedidos.</p>
        <p className="mt-1 text-sm text-ink/70">Aquí verás el estado de tus compras.</p>
        <Button as={Link} to="/catalogo" variant="secondary" size="sm" className="mt-4">Ir a la tienda</Button>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-lavender">
      {orders.map((order) => (
        <li key={order.id}>
          <Link to={`/cuenta/pedidos/${order.orderNumber}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-lavender/40 sm:px-2">
            <div>
              <p className="font-semibold text-brand-dark">{order.orderNumber}</p>
              <p className="text-sm text-ink/80">
                {formatDate(order.createdAt)} · {pieces(order)} {pieces(order) === 1 ? 'prenda' : 'prendas'} · {formatPrice(order.total)}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ProfileForm() {
  const { user, setUser } = useAuth();
  const [message, setMessage] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, phone: user.phone },
  });

  const onSubmit = async (data) => {
    setMessage(null);
    try {
      const res = await apiFetch('/users/me', { method: 'PATCH', body: data });
      setUser(res.user);
      reset({ name: res.user.name, phone: res.user.phone });
      setMessage({ type: 'success', text: 'Tus datos se guardaron.' });
    } catch (err) {
      const general = applyApiErrors(err, setError, ['name', 'phone']);
      if (general) setMessage({ type: 'error', text: general });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Alert variant={message?.type}>{message?.text}</Alert>
      <TextField label="Nombre completo" autoComplete="name" error={errors.name?.message} {...register('name')} />
      <TextField
        label="Correo electrónico"
        value={user.email}
        disabled
        readOnly
        hint="El correo es tu usuario y no se puede cambiar."
      />
      <TextField
        label="Teléfono"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        error={errors.phone?.message}
        {...register('phone')}
      />
      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </form>
  );
}

function PasswordForm() {
  const { startSession } = useAuth();
  const [message, setMessage] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });
  const newPassword = useWatch({ control, name: 'newPassword' });

  const onSubmit = async (data) => {
    setMessage(null);
    try {
      const res = await apiFetch('/users/me/password', { method: 'PATCH', body: data });
      startSession(res); // el backend cerró las demás sesiones y abrió una nueva aquí
      reset();
      setMessage({
        type: 'success',
        text: 'Contraseña actualizada. Cerramos tu sesión en los demás dispositivos.',
      });
    } catch (err) {
      const general = applyApiErrors(err, setError, ['currentPassword', 'newPassword']);
      if (general) setMessage({ type: 'error', text: general });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Alert variant={message?.type}>{message?.text}</Alert>
      <PasswordField
        label="Contraseña actual"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <PasswordField
        label="Nueva contraseña"
        autoComplete="new-password"
        showRules
        value={newPassword}
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <Button type="submit" variant="secondary" disabled={isSubmitting}>
        {isSubmitting ? 'Actualizando…' : 'Cambiar contraseña'}
      </Button>
    </form>
  );
}

export default function AccountPage() {
  usePageTitle('Mi cuenta');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm uppercase tracking-brand text-brand-soft">
            <StarIcon className="size-3 text-gold" /> Mi cuenta
          </p>
          <h1 className="mt-1 text-3xl text-brand-dark">Hola, {user.name.split(' ')[0]}</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>

      <div className="space-y-6">
        <Section title="Mis pedidos">
          <MyOrders />
        </Section>
        <Section title="Mis datos">
          <ProfileForm />
        </Section>
        <Section title="Contraseña">
          <PasswordForm />
        </Section>
      </div>
    </main>
  );
}
