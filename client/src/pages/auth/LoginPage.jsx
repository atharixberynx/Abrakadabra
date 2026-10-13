import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { PasswordField } from '../../components/ui/PasswordField.jsx';
import { TextField } from '../../components/ui/TextField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePageTitle } from '../../hooks/usePageTitle.js';
import { getRedirectTarget } from '../../routes/redirect.js';
import { loginSchema } from '../../schemas/auth.js';

export default function LoginPage() {
  usePageTitle('Iniciar sesión');
  const { login, status, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  // Si ya hay sesión, no tiene sentido mostrar el formulario
  if (status === 'authenticated' && !isSubmitting) {
    return <Navigate to={getRedirectTarget(location, user)} replace />;
  }

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      const loggedUser = await login(data);
      // Regresa a donde estaba (p. ej. el checkout) con el carrito intacto
      navigate(getRedirectTarget(location, loggedUser), { replace: true });
    } catch (err) {
      setServerError(err.message);
    }
  };

  return (
    <AuthLayout title="Iniciar sesión" subtitle="Qué gusto verte de nuevo.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Alert variant="error">{serverError}</Alert>

        <TextField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label="Contraseña"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
        </Button>
      </form>

      <p className="mt-8 text-center text-ink/80">
        ¿No tienes cuenta?{' '}
        <Link
          to="/registro"
          state={location.state}
          className="font-medium text-brand underline-offset-4 hover:underline"
        >
          Crea una aquí
        </Link>
      </p>
    </AuthLayout>
  );
}
