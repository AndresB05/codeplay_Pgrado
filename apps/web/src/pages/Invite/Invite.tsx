import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Canopy, MonsteraLeaf, Toucan } from '../../components/decor/JungleDecor';
import { ROUTES } from '../../constants/routes';
import {
  savePendingInvitationToken,
  takePendingInvitationToken,
} from '../../context/invitationToken.helpers';
import { useAuth } from '../../hooks/useAuth';
import { useClassrooms } from '../../hooks/useClassrooms';
import { invitationsService, type InvitationPreview } from '../../services/invitations.service';
import type { AppError } from '../../errors/AppError';

/* El marco de selva es el mismo en los seis estados; sólo cambia lo de dentro. */
const Frame = ({ children }: { children: ReactNode }) => (
  <div className="jungle-surface relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-4">
    <Canopy />

    <MonsteraLeaf
      size={120}
      className="pointer-events-none absolute -left-6 top-10 rotate-[24deg]"
      color="#12703D"
    />
    <Toucan size={96} className="pointer-events-none absolute bottom-8 right-8" />

    <section className="card relative z-10 w-full max-w-[520px] px-8 py-10 text-center">
      {children}
    </section>
  </div>
);

const Waiting = ({ title }: { title: string }) => (
  <>
    <span className="chip chip-leaf">Un momento</span>
    <h1 className="title-xl mt-3">{title}</h1>
    <div className="mt-8 flex justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-line border-t-grape-dark" />
    </div>
  </>
);

/**
 * Pantalla del enlace de invitación.
 *
 * **No cuelga de ninguna guarda, y es la segunda ruta del proyecto así.** El
 * motivo es el mismo que el de `/auth/callback`, no una excepción cómoda: una
 * guarda sólo sabe que hay o no hay sesión. `PrivateRoute` mandaría a `/login` a
 * quien llega sin cuenta —que es el caso NORMAL de una invitación, porque el
 * tutor se la pasa a una familia nueva— y al hacerlo se llevaría por delante el
 * token, que viaja en la dirección y es lo único que esa persona traía.
 * `PublicRoute` haría lo simétrico con quien sí tiene sesión: apartarlo a su
 * panel sin canjear nada.
 *
 * Los estados los resuelve la pantalla, y ninguno acaba en un rebote mudo.
 */
export const Invite = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { loading: authLoading, session, user } = useAuth();
  const { currentGroup, error: storeError, membership, redeemInvitation } = useClassrooms();

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [previewError, setPreviewError] = useState<AppError | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemFailed, setRedeemFailed] = useState(false);

  /**
   * ESTA PANTALLA ES LA DUEÑA ÚNICA DEL TOKEN GUARDADO, y puede serlo porque es
   * el único destino al que ese token lleva. Los tres que deciden destino sólo
   * lo miran; el almacén lo escribe y lo borra este efecto.
   *
   * - **Sin sesión**: se guarda, porque el rodeo del registro va a empezar y con
   *   Google sale de la aplicación entera.
   * - **Con sesión**: se borra, porque el rodeo terminó. El token sigue vivo en
   *   la dirección, así que no se pierde nada, y si esta persona se va sin
   *   canjear no queda nada esperando al siguiente que use el navegador.
   *
   * El borrado es INCONDICIONAL, no «si coincide con el de la URL»: alguien
   * puede llegar arrastrando el token de un rodeo que abandonó y abrir un enlace
   * distinto, y el condicional dejaría vivo el viejo. Guardar sobrescribe, así
   * que el caso sin sesión queda igual de limpio.
   */
  useEffect(() => {
    if (!token || authLoading) {
      return;
    }

    if (session) {
      takePendingInvitationToken();

      return;
    }

    savePendingInvitationToken(token);
  }, [authLoading, session, token]);

  /*
   * La previsualización necesita sesión —la función no se concede a `anon`—, así
   * que sólo se pide cuando la hay. Quien todavía no tiene cuenta ve el nombre
   * del salón un segundo después, al volver del registro.
   */
  useEffect(() => {
    if (!token || !session || authLoading) {
      return;
    }

    let cancelled = false;

    const load = async (): Promise<void> => {
      setLoadingPreview(true);

      const { data, error } = await invitationsService.previewInvitation(token);

      if (cancelled) {
        return;
      }

      setPreview(data);
      setPreviewError(error);
      setLoadingPreview(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [authLoading, session, token]);

  const handleRedeem = useCallback(async (): Promise<void> => {
    if (!token) {
      return;
    }

    setRedeeming(true);
    setRedeemFailed(false);

    const entered = await redeemInvitation(token);

    if (entered) {
      navigate(ROUTES.CLASSROOM);

      return;
    }

    setRedeeming(false);
    setRedeemFailed(true);
  }, [navigate, redeemInvitation, token]);

  if (!token) {
    return (
      <Frame>
        <span className="chip chip-coral">Enlace incompleto</span>
        <h1 className="title-xl mt-3">Ese enlace no está entero</h1>
        <p className="subtitle mt-1">Pídele a tu profesor que te lo comparta otra vez, completo.</p>
      </Frame>
    );
  }

  if (authLoading) {
    return (
      <Frame>
        <Waiting title="Abriendo tu invitación…" />
      </Frame>
    );
  }

  /* Sin cuenta: el caso normal. El token ya está guardado por el efecto. */
  if (!session) {
    return (
      <Frame>
        <span className="chip chip-sun">Te invitaron a un salón</span>
        <h1 className="title-xl mt-3">¡Te esperan en la selva!</h1>
        <p className="subtitle mt-1">
          Crea tu cuenta de explorador y entrarás al salón en cuanto termines. Si ya tienes cuenta,
          inicia sesión y te traemos de vuelta aquí.
        </p>

        <button
          type="button"
          onClick={() => navigate(ROUTES.SIGNUP_CHILD)}
          className="btn btn-sun mt-7 w-full"
        >
          Crear mi cuenta
          <span aria-hidden="true">→</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(ROUTES.LOGIN)}
          className="btn btn-ghost btn-sm mt-4"
        >
          Ya tengo cuenta
        </button>
      </Frame>
    );
  }

  if (user?.role === 'tutor') {
    return (
      <Frame>
        <span className="chip chip-mint">Esta cuenta es de tutor</span>
        <h1 className="title-xl mt-3">Los salones se canjean desde una cuenta de niño</h1>
        {/*
         * Se dice lo que pasa y no «no tienes permiso»: el rol se fija en el
         * primer registro y no cambia nunca, así que esta persona no puede
         * arreglarlo desde ninguna pantalla y merece saberlo.
         */}
        <p className="subtitle mt-1">
          Tu tipo de cuenta no cambia, así que este enlace no es para ti. Si el salón es tuyo,
          compártelo con el explorador que quieras sumar.
        </p>

        <button
          type="button"
          onClick={() => navigate(ROUTES.TEACHER_GROUPS)}
          className="btn btn-grape mt-7 w-full"
        >
          Ir a mis salones
          <span aria-hidden="true">→</span>
        </button>
      </Frame>
    );
  }

  if (loadingPreview) {
    return (
      <Frame>
        <Waiting title="Abriendo tu invitación…" />
      </Frame>
    );
  }

  if (previewError || !preview) {
    return (
      <Frame>
        <span className="chip chip-coral">Ese enlace no vale</span>
        <h1 className="title-xl mt-3">No pudimos abrir la invitación</h1>
        <p className="subtitle mt-1">{previewError?.message ?? 'Ese enlace no es válido.'}</p>

        <button
          type="button"
          onClick={() => navigate(ROUTES.CLASSROOM)}
          className="btn btn-grape mt-7 w-full"
        >
          Buscar mi salón
          <span aria-hidden="true">→</span>
        </button>
      </Frame>
    );
  }

  if (preview.state !== 'valid') {
    return (
      <Frame>
        <span className="chip chip-coral">
          {preview.state === 'used' ? 'Ese enlace ya se usó' : 'Ese enlace caducó'}
        </span>
        <h1 className="title-xl mt-3">{preview.groupName}</h1>
        <p className="subtitle mt-1">
          {preview.state === 'used'
            ? 'Alguien ya entró con este enlace. Pídele a tu profesor uno nuevo.'
            : 'Este enlace pasó de fecha. Pídele a tu profesor uno nuevo.'}
        </p>

        <button
          type="button"
          onClick={() => navigate(ROUTES.CLASSROOM)}
          className="btn btn-grape mt-7 w-full"
        >
          Buscar mi salón
          <span aria-hidden="true">→</span>
        </button>
      </Frame>
    );
  }

  /*
   * Los DOS rechazos por pertenencia previa, que el servidor no distingue: la
   * RPC responde 23505 en los dos casos. Decirle «sal de tu salón antes de
   * entrar en otro» a quien abre un enlace del salón en el que ya está es una
   * instrucción falsa —no tiene nada que hacer, ya está dentro—, así que la
   * distinción la hace el cliente, que sí tiene el dato: el ID público que
   * devuelve la previsualización y el del salón del niño.
   */
  if (membership.status === 'member') {
    const isOwnClassroom = currentGroup?.publicId === preview.groupPublicId;

    return (
      <Frame>
        <span className="chip chip-mint">
          {isOwnClassroom ? 'Ya estás dentro' : 'Ya tienes salón'}
        </span>
        <h1 className="title-xl mt-3">
          {isOwnClassroom ? `Ya estás en ${preview.groupName}` : 'Ya perteneces a otro salón'}
        </h1>
        <p className="subtitle mt-1">
          {isOwnClassroom
            ? 'Este enlace lleva a tu propio salón, así que no tienes que hacer nada.'
            : `Para entrar a ${preview.groupName} tienes que salir antes de tu salón actual.`}
        </p>

        <button
          type="button"
          onClick={() => navigate(ROUTES.CLASSROOM)}
          className="btn btn-grape mt-7 w-full"
        >
          Ir a mi salón
          <span aria-hidden="true">→</span>
        </button>
      </Frame>
    );
  }

  return (
    <Frame>
      <span className="chip chip-sun">Te invitaron a un salón</span>
      <h1 className="title-xl mt-3">{preview.groupName}</h1>
      <p className="subtitle mt-1">
        Salón <strong>{preview.groupPublicId}</strong> · {preview.freeSeats} cupos libres
      </p>

      {/*
       * El canje NO ocurre al cargar la pantalla, sólo al pulsar. Un enlace
       * sirve una sola vez, y gastarlo por una visita equivocada o por un enlace
       * reenviado por error no tendría vuelta atrás.
       */}
      <button
        type="button"
        onClick={handleRedeem}
        disabled={redeeming}
        className="btn btn-sun mt-7 w-full"
      >
        {redeeming ? 'Entrando…' : 'Entrar a este salón'}
        <span aria-hidden="true">→</span>
      </button>

      {membership.status === 'pending' ? (
        <p className="mt-4 rounded-[16px] border-2 border-line bg-cream px-4 py-3 text-[15px] font-semibold text-ink-faint">
          Tienes una solicitud esperando en otro salón. Al entrar aquí, esa solicitud se cancela.
        </p>
      ) : null}

      {/*
       * El motivo lo pone el servicio y se enseña en la pantalla desde la que se
       * intentó, como manda la convención: dejarlo sólo en el estado del store
       * es lo mismo que tragárselo.
       */}
      {redeemFailed ? (
        <p className="mt-4 rounded-[16px] border-2 border-coral-dark bg-coral-soft px-4 py-3 text-[15px] font-bold text-coral-dark">
          {storeError?.message ?? 'No pudimos meterte en el salón con ese enlace.'}
        </p>
      ) : null}
    </Frame>
  );
};
