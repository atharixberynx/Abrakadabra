import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { PasswordField } from '../../components/ui/PasswordField.jsx';
import { TextField } from '../../components/ui/TextField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { applyApiErrors } from '../../lib/forms.js';
import { getRedirectTarget } from '../../routes/redirect.js';
import { registerSchema } from '../../schemas/auth.js';

const FIELDS = ['name', 'email', 'phone', 'password'];

export default function RegisterPage() {
  usePageTitle('Crear cuenta');
  const { register: registerAccount, status, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '' },
  });
  const password = useWatch({ control, name: 'password' });

  if (status === 'authenticated' && !isSubmitting) {
    return <Navigate to={getRedirectTarget(location, user)} replace />;
  }

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      const newUser = await registerAccount(data);
      navigate(getRedirectTarget(location, newUser), { replace: true });
    } catch (err) {
      setServerError(applyApiErrors(err, setError, FIELDS));
    }
  };

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Regístrate para comprar en línea y ver el estado de tus pedidos."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {location.state?.reason === 'checkout' && (
          <Alert variant="info">Crea tu cuenta para completar tu compra. Tu carrito se queda guardado.</Alert>
        )}
        <Alert variant="error">{serverError}</Alert>

        <TextField
          label="Nombre completo"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <TextField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Teléfono"
          type="tel"
          autoComplete="tel-national"
          inputMode="tel"
          placeholder="7777-7777"
          hint="Te contactaremos solo si hay algo con tu pedido."
          error={errors.phone?.message}
          {...register('phone')}
        />
        <PasswordField
          label="Contraseña"
          autoComplete="new-password"
          showRules
          value={password}
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creando tu cuenta…' : 'Crear cuenta'}
        </Button>
      </form>

      <p className="mt-8 text-center text-ink/80">
        ¿Ya tienes cuenta?{' '}
        <Link
          to="/iniciar-sesion"
          state={location.state}
          className="font-medium text-brand underline-offset-4 hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
