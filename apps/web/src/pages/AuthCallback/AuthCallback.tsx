import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canopy, MonsteraLeaf, Toucan } from '../../components/decor/JungleDecor';
import { ROUTES } from '../../constants/routes';
import { resolveLandingRoute } from '../../context/auth.helpers';
import { takePendingSignupRole } from '../../context/oauthRole.helpers';
import { useAuth } from '../../hooks/useAuth';

/**
 * Motivo que el proveedor dejó en el fragmento de la URL cuando la vuelta falla.
 *
 * El cliente de Supabase sólo limpia el fragmento cuando consigue extraer una
 * sesión de él, así que en el camino de error sigue ahí y se puede leer.
 */
const readProviderError = (): string | null => {
  const fragment = window.location.hash.replace(/^#/, '');

  if (!fragment) {
    return null;
  }

  const params = new URLSearchParams(fragment);
  const code = params.get('error');

  if (!code) {
    return null;
  }

  const description = params.get('error_description') ?? code;

  /*
   * Llega con los escapes de la URL —«code%3A 4%2F0A»—, y un motivo que no se
   * puede leer no sirve para lo único que este estado existe. El `catch` no es
   * decorativo: `decodeURIComponent` LANZA ante una cadena mal escapada, y sin
   * él se llevaría por delante la pantalla entera justo cuando hay algo que
   * contar.
   */
  try {
    return decodeURIComponent(description.replace(/\+/g, ' '));
  } catch {
    return description;
  }
};

/**
 * Pantalla de vuelta del proveedor de OAuth.
 *
 * Existe porque al construir el `redirectTo` todavía no se sabe cuál será el
 * rol —el perfil no existe hasta que el alta ocurre—, así que no hay ningún
 * panel al que volver directamente sin rebotar a la mitad de la gente.
 *
 * **No cuelga de ninguna guarda, y es deliberado.** Una guarda sólo sabe que no
 * hay sesión, y con eso no distingue «el proveedor falló» de «alguien escribió
 * esta dirección»: redirigir en el primer caso borra el motivo justo cuando es
 * lo único que se tiene. Los cuatro estados los resuelve la pantalla, y el de
 * «sin sesión» sigue acabando en `/login`, igual que antes.
 */
export const AuthCallback = () => {
  const navigate = useNavigate();
  const { error, loading, session, updateRole, user } = useAuth();

  // Se lee una sola vez, al montar: si la vuelta trae sesión, el cliente de
  // Supabase limpia el fragmento y en un render posterior ya no habría nada.
  const [providerError] = useState(readProviderError);
  const [roleFailed, setRoleFailed] = useState(false);
  const [roleLocked, setRoleLocked] = useState(false);


  /*
   * El efecto depende de `user`, que se reconstruye al fijar el rol, así que sin
   * esta marca volvería a entrar y leería una intención ya consumida. Va en una
   * referencia y no en estado porque no tiene que provocar ningún render.
   */
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (providerError || loading) {
      return;
    }

    if (!session) {
      navigate(ROUTES.LOGIN, { replace: true });
      return;
    }

    if (!user || resolvedRef.current) {
      return;
    }

    resolvedRef.current = true;

    const resolveRole = async (): Promise<void> => {
      const pendingRole = takePendingSignupRole();

      /*
       * Se llama SIEMPRE que haya intención, coincida o no con el rol actual.
       *
       * La versión anterior añadía `&& pendingRole !== user.role`, y ese atajo
       * era un agujero: el disparador crea TODO perfil de Google como `child`,
       * así que quien se registra eligiendo «Niño» tiene intención `child` y rol
       * `child`, coinciden, y la RPC no se llamaba. **La marca no se ponía
       * nunca**, y esa cuenta quedaba indistinguible de la de quien sólo pulsó
       * Google en `/login` sin elegir: promocionable a tutor más adelante. La
       * regla se incumplía en el camino más común de todos.
       *
       * El fallo de fondo era definir «hace falta escribir» como «el rol
       * difiere». La definición correcta es «hay intención y el rol aún no está
       * declarado», y **el segundo dato sólo lo tiene el servidor**. Así que el
       * cliente deja de decidirlo: manda la intención, y la RPC —que ya lleva
       * las dos rejas— resuelve si se aplica.
       *
       * Entrar por la pantalla de acceso sigue sin dejar intención, así que ese
       * camino sigue sin poder tocar el rol de nadie.
       */
      if (pendingRole) {
        const applied = await updateRole(pendingRole);

        /*
         * El servidor rechazó fijar el rol porque esta cuenta ya existía —ya
         * había declarado su rol, o tiene lazos de salón—. Eso NO es un fallo:
         * la sesión es buena y la persona está dentro; lo único que no ocurrió
         * es un cambio que no debía ocurrir. Por eso lleva aviso neutro y no
         * pantalla de error, y por eso no se cierra la sesión ni se va a
         * `/login`.
         */
        if (applied.status === 'locked') {
          setRoleLocked(true);
          return;
        }

        if (applied.status === 'error') {
          setRoleFailed(true);
          return;
        }

        // El destino lo decide el perfil que devolvió el servidor, NO el rol que
        // se pidió. Hoy coinciden porque la RPC escribe lo mismo que valida,
        // pero navegar con lo pedido es el error que `useRoleHomeRedirect`
        // existe para no cometer: si algún día dejaran de coincidir, se vería el
        // desajuste en vez de un rebote de `PrivateRoute` sin explicación.
        navigate(resolveLandingRoute(applied.user.role));
        return;
      }

      navigate(resolveLandingRoute(user.role));
    };

    void resolveRole();
  }, [loading, navigate, providerError, session, updateRole, user]);

  const failureMessage = providerError ?? (roleFailed ? error?.message ?? null : null);


  return (
    <div className="jungle-surface relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-4">
      <Canopy />

      <MonsteraLeaf
        size={120}
        className="pointer-events-none absolute -left-6 top-10 rotate-[24deg]"
        color="#12703D"
      />
      <Toucan size={96} className="pointer-events-none absolute bottom-8 right-8" />

      <section className="card relative z-10 w-full max-w-[520px] px-8 py-10 text-center">
        {roleLocked ? (
          <>
            <span className="chip chip-leaf">Ya nos conocíamos</span>
            <h1 className="title-xl mt-3">Ya tenías una cuenta</h1>
            {/*
             * El texto NO dice «como te registraste». El servidor rechaza por dos
             * motivos —el rol ya declarado y los lazos de salón— y el cliente los
             * trata igual a propósito, así que aquí no se sabe cuál de los dos
             * fue. Una cuenta creada desde el acceso nunca eligió rol, y afirmar
             * que se registró así sería falso justo en el caso que este cambio
             * existe para proteger. Se dice el rol con el que entra, que es lo
             * único cierto en los dos casos.
             */}
            <p className="subtitle mt-1">
              Enlazamos tu acceso con Google a la cuenta que ya existía con este correo. Entras
              como <strong>{user?.role === 'tutor' ? 'Tutor' : 'Niño'}</strong>, y tu tipo de
              cuenta no cambia.
            </p>

            <button
              type="button"
              onClick={() => navigate(resolveLandingRoute(user?.role ?? null))}
              className="btn btn-grape mt-7 w-full"
            >
              Continuar
              <span aria-hidden="true">→</span>
            </button>
          </>
        ) : failureMessage ? (
          <>
            <span className="chip chip-coral">No se pudo entrar</span>
            <h1 className="title-xl mt-3">Algo falló al volver</h1>
            <p className="subtitle mt-1">
              {providerError
                ? 'El acceso con Google no llegó a completarse.'
                : 'Entraste, pero no pudimos asignar tu tipo de cuenta.'}
            </p>

            {/*
             * El motivo del proveedor se enseña tal cual, aunque venga en inglés:
             * es el único dato que hay para diagnosticar, y esconderlo deja la
             * pantalla diciendo «algo falló» y nada más.
             */}
            <p className="mt-6 rounded-[16px] border-2 border-coral-dark bg-coral-soft px-4 py-3 text-left text-[14px] font-bold text-coral-dark">
              {failureMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(providerError ? ROUTES.LOGIN : resolveLandingRoute(user?.role ?? null))
              }
              className="btn btn-grape mt-7 w-full"
            >
              {providerError ? 'Volver al acceso' : 'Continuar de todos modos'}
              <span aria-hidden="true">→</span>
            </button>
          </>
        ) : (
          <>
            <span className="chip chip-leaf">Un momento</span>
            <h1 className="title-xl mt-3">Terminando el acceso…</h1>
            <p className="subtitle mt-1">Estamos preparando tu espacio en la selva.</p>
            <div className="mt-8 flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-line border-t-grape-dark" />
            </div>
          </>
        )}
      </section>
    </div>
  );
};
