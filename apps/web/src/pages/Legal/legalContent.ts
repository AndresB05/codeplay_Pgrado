export type LegalItem = { lead?: string; text: string };

export type LegalBlock =
  | { kind: 'paragraph'; lead?: string; text: string }
  | { kind: 'list'; items: LegalItem[] };

export type LegalSection = { heading: string; blocks: LegalBlock[] };

export type LegalDocument = { title: string; sections: LegalSection[] };

/*
 * Transcripción literal de `Terminos_y_condiciones.docx` y
 * `Politica_de_privacidad.docx`. Los corchetes son huecos que el documento deja
 * por rellenar: se mantienen hasta que haya dato, no se inventan.
 */
export const TERMS: LegalDocument = {
  title: 'Términos y condiciones de uso',
  sections: [
    {
      heading: '1. Aceptación de los términos',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Estos términos y condiciones regulan el uso de CodePlay («la plataforma»), una plataforma educativa de programación visual para fortalecer el pensamiento computacional en niños y jóvenes, desarrollada en la Facultad de Ingeniería de la Corporación Universitaria Adventista (UNAC), en Medellín, Colombia. Al crear una cuenta o usar la plataforma, aceptas estos términos y la política de privacidad. Si no estás de acuerdo con ellos, no uses la plataforma.',
        },
      ],
    },
    {
      heading: '2. Descripción del servicio',
      blocks: [
        {
          kind: 'paragraph',
          text: 'CodePlay funciona como un salón de clases virtual. Los profesores o tutores crean grupos y los estudiantes se unen a ellos con un código. Los estudiantes juegan niveles de programación por bloques cuya dificultad va aumentando y ganan logros, y los profesores o tutores pueden consultar el progreso de sus grupos. La plataforma se ofrece sin costo y con fines educativos y de investigación.',
        },
      ],
    },
    {
      heading: '3. Quién puede usar la plataforma',
      blocks: [
        {
          kind: 'list',
          items: [
            {
              lead: 'Profesores o tutores:',
              text: 'personas mayores de edad que usan la plataforma para acompañar a sus estudiantes y que son responsables de los grupos que crean.',
            },
            {
              lead: 'Estudiantes:',
              text: 'niños, niñas y jóvenes que se unen a un grupo con el código de su profesor o tutor.',
            },
            {
              lead: 'Menores de edad:',
              text: 'su uso requiere la autorización de sus padres, madres o acudientes y, cuando corresponda, de la institución educativa. Al registrar a un menor, quien lo hace declara contar con esa autorización.',
            },
          ],
        },
      ],
    },
    {
      heading: '4. Cuentas de usuario',
      blocks: [
        {
          kind: 'list',
          items: [
            { text: 'Debes darnos información verdadera y mantenerla actualizada.' },
            { text: 'Tu cuenta es personal. No la compartas ni uses la de otra persona.' },
            {
              text: 'Eres responsable de mantener segura tu contraseña y de lo que ocurra desde tu cuenta. Si sospechas que alguien más accedió a ella, cámbiala y avísanos.',
            },
            {
              text: 'Puedes eliminar tu cuenta o solicitar su eliminación en cualquier momento, como se explica en la política de privacidad.',
            },
          ],
        },
      ],
    },
    {
      heading: '5. Grupos y códigos de ingreso',
      blocks: [
        {
          kind: 'list',
          items: [
            {
              text: 'El profesor o tutor que crea un grupo recibe un código único para que sus estudiantes se unan.',
            },
            {
              text: 'El código debe compartirse solo con los estudiantes del grupo. No lo publiques en redes sociales ni en sitios abiertos.',
            },
            {
              text: 'El profesor o tutor puede retirar estudiantes, generar un nuevo código o eliminar el grupo.',
            },
            {
              text: 'Los profesores o tutores solo pueden ver el progreso de los estudiantes que pertenecen a sus propios grupos.',
            },
          ],
        },
      ],
    },
    {
      heading: '6. Uso aceptable',
      blocks: [
        { kind: 'paragraph', text: 'Al usar la plataforma te comprometes a no:' },
        {
          kind: 'list',
          items: [
            {
              text: 'Intentar acceder a cuentas, grupos o datos de otras personas sin autorización.',
            },
            {
              text: 'Suplantar a otro usuario ni dar información falsa sobre tu identidad o tu rol.',
            },
            {
              text: 'Alterar, atacar o intentar vulnerar la seguridad o el funcionamiento de la plataforma, ni usar programas automáticos para acceder a ella.',
            },
            {
              text: 'Usar nombres de usuario, nombres de grupos u otros textos ofensivos, discriminatorios o que vulneren derechos de otras personas.',
            },
            { text: 'Usar la plataforma con fines comerciales o ajenos a los educativos.' },
          ],
        },
      ],
    },
    {
      heading: '7. Datos personales y privacidad',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Tratamos tus datos personales conforme a la legislación colombiana y a la política de privacidad de CodePlay, que forma parte de estos términos. Allí se explica qué datos recopilamos, para qué los usamos y cuáles son tus derechos, con especial cuidado en el caso de los menores de edad.',
        },
      ],
    },
    {
      heading: '8. Propiedad intelectual',
      blocks: [
        {
          kind: 'paragraph',
          text: 'La plataforma, el juego, sus personajes, niveles, diseños, textos y código fuente pertenecen a sus autores y a la Corporación Universitaria Adventista, según corresponda, y están protegidos por las normas de propiedad intelectual. Te otorgamos una licencia limitada, personal, no exclusiva y no transferible para usar la plataforma con fines educativos. No puedes copiar, modificar, distribuir ni explotar comercialmente sus contenidos sin autorización.',
        },
      ],
    },
    {
      heading: '9. Uso académico y de investigación',
      blocks: [
        {
          kind: 'paragraph',
          text: 'CodePlay hace parte de un proyecto académico. Los datos de uso pueden analizarse de forma agregada y sin identificar a las personas para evaluar y mejorar la plataforma y para fines de investigación educativa. Los puntajes y logros de la plataforma son una herramienta de apoyo y no sustituyen la evaluación formal que realiza cada profesor o tutor.',
        },
      ],
    },
    {
      heading: '10. Disponibilidad y cambios en el servicio',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Trabajamos para que la plataforma funcione de manera continua, pero no podemos garantizar que esté libre de interrupciones o errores. Por tratarse de un proyecto en desarrollo, podemos modificar, suspender o retirar funciones, o trasladar la plataforma a otra infraestructura, procurando avisar con anticipación cuando sea posible.',
        },
      ],
    },
    {
      heading: '11. Limitación de responsabilidad',
      blocks: [
        {
          kind: 'paragraph',
          text: 'La plataforma se ofrece «tal como está», con fines educativos. No garantizamos resultados de aprendizaje específicos. En la medida permitida por la ley, no respondemos por daños derivados de interrupciones del servicio, del uso indebido de las credenciales de acceso por parte de los usuarios o de la pérdida de información causada por circunstancias fuera de nuestro control. Esto no afecta los derechos que la ley reconoce a los usuarios.',
        },
      ],
    },
    {
      heading: '12. Suspensión y terminación',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Podemos suspender o eliminar una cuenta o un grupo si se incumplen estos términos, si se pone en riesgo la seguridad de la plataforma o de otras personas, o si lo exige una autoridad competente. También puedes dejar de usar la plataforma y eliminar tu cuenta cuando quieras.',
        },
      ],
    },
    {
      heading: '13. Cambios a estos términos',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Podemos actualizar estos términos por cambios en la plataforma o en la ley. La versión vigente estará siempre publicada en la plataforma. Si sigues usándola después de un cambio, entendemos que aceptas la versión actualizada.',
        },
      ],
    },
    {
      heading: '14. Ley aplicable y jurisdicción',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Estos términos se rigen por las leyes de la República de Colombia. Cualquier controversia se resolverá ante las autoridades competentes de Medellín, Colombia, sin perjuicio de las competencias que la ley reconozca a otras autoridades.',
        },
      ],
    },
    {
      heading: '15. Contacto',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Si tienes dudas sobre estos términos, consulta con tu profesor o tutor o comunícate con el equipo del proyecto de la Facultad de Ingeniería de la Corporación Universitaria Adventista (UNAC).',
        },
      ],
    },
  ],
};

export const PRIVACY: LegalDocument = {
  title: 'Política de privacidad',
  sections: [
    {
      heading: 'Antecedentes',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Esta política explica con lenguaje claro qué datos recopila CodePlay («la plataforma», «nosotros») cuando la usas, para qué los usamos y cuáles son tus derechos. La plataforma es un entorno educativo de programación visual para fortalecer el pensamiento computacional en niños y jóvenes. Como puede ser usada por menores de edad, tratamos sus datos con especial cuidado.',
        },
        {
          kind: 'paragraph',
          lead: '¿Qué son los datos personales?',
          text: 'Cualquier información que permita identificarte directa o indirectamente, como tu nombre, tu correo o tu nombre de usuario.',
        },
        {
          kind: 'paragraph',
          lead: '¿Qué ley aplica?',
          text: 'Tratamos tus datos conforme a la Ley 1581 de 2012 (protección de datos personales), su normativa reglamentaria y la Ley 1098 de 2006 (Código de la Infancia y la Adolescencia).',
        },
      ],
    },
    {
      heading: 'Responsable del tratamiento',
      blocks: [
        {
          kind: 'paragraph',
          text: 'La responsable es la Corporación Universitaria Adventista (UNAC), Medellín, Colombia, a través del equipo del proyecto [nombre del equipo o programa]. Para cualquier consulta sobre tus datos: [correo de contacto].',
        },
      ],
    },
    {
      heading: 'Qué datos recopilamos',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Recopilamos solo los datos necesarios para que la plataforma funcione:',
        },
        {
          kind: 'list',
          items: [
            {
              lead: 'Cuenta:',
              text: 'nombre completo, correo electrónico, nombre de usuario, contraseña (almacenada de forma cifrada) y rol (estudiante, docente o administrador).',
            },
            {
              lead: 'Inicio de sesión con Google:',
              text: 'si eliges esta opción, recibimos los datos básicos de tu cuenta de Google (nombre y correo).',
            },
            {
              lead: 'Grupos o salones:',
              text: 'nombre del grupo, docente responsable, código único del grupo y la lista de estudiantes que se unen a él mediante ese código.',
            },
            {
              lead: 'Progreso y uso:',
              text: 'niveles completados, puntajes, intentos, logros obtenidos y registro de sesiones (fecha y hora de inicio y cierre, y acciones relevantes).',
            },
            {
              lead: 'Invitaciones por correo (cuando esta función esté disponible):',
              text: 'si un docente invita a un grupo por correo, usamos la dirección indicada solo para enviar esa invitación.',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: 'No pedimos datos sensibles (origen racial o étnico, salud, creencias religiosas o políticas, datos biométricos, etc.).',
        },
      ],
    },
    {
      heading: 'Para qué usamos tus datos',
      blocks: [
        {
          kind: 'list',
          items: [
            { text: 'Crear y gestionar tu cuenta y tu acceso.' },
            {
              text: 'Permitir que los docentes creen grupos, compartan el código de ingreso y vean el progreso de sus estudiantes, y que los estudiantes se unan a un grupo con ese código.',
            },
            { text: 'Guardar tu avance y tus logros en el juego.' },
            {
              text: 'Enviarte las invitaciones y notificaciones necesarias para usar la plataforma.',
            },
            { text: 'Garantizar la seguridad del sistema.' },
            {
              text: 'Con fines académicos, analizar el uso de la plataforma de forma agregada y sin identificar a personas, en el marco del proyecto de investigación.',
            },
          ],
        },
      ],
    },
    {
      heading: 'Principios y base del tratamiento',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Tratamos los datos según los principios de finalidad, minimización, confidencialidad y seguridad: los usamos solo para los fines descritos, recogemos el mínimo necesario y los protegemos del acceso no autorizado. La base del tratamiento es tu autorización (o la de tus padres o acudientes si eres menor de edad).',
        },
      ],
    },
    {
      heading: 'Menores de edad',
      blocks: [
        {
          kind: 'list',
          items: [
            {
              text: 'El tratamiento de datos de niños, niñas y adolescentes responde a su interés superior y respeta sus derechos fundamentales.',
            },
            {
              text: 'Cuando el usuario es menor de edad, el tratamiento requiere la autorización de su padre, madre o acudiente, y se tiene en cuenta la opinión del menor según su madurez. El tutor encargado del menor (su padre, madre, acudiente o profesor) se hace responsable de las actividades que este realice en la plataforma.',
            },
            {
              text: 'Los padres o acudientes pueden consultar, corregir o pedir la eliminación de los datos del menor.',
            },
            {
              text: 'No usamos los datos de menores con fines publicitarios ni de perfilado comercial.',
            },
          ],
        },
      ],
    },
    {
      heading: 'Seguridad',
      blocks: [
        {
          kind: 'list',
          items: [
            { text: 'La comunicación con la plataforma se cifra mediante HTTPS.' },
            { text: 'Las contraseñas se almacenan cifradas.' },
            {
              text: 'Cada usuario solo puede acceder a sus propios datos, mediante políticas de seguridad a nivel de fila en la base de datos, y los docentes solo ven a los estudiantes de sus propios grupos. El código del grupo solo debe compartirse con los estudiantes que pertenecen a él.',
            },
            { text: 'Los datos que se muestran públicamente se limitan al mínimo necesario.' },
          ],
        },
        {
          kind: 'paragraph',
          text: 'Ningún sistema es 100 % seguro. Si ocurre una brecha que afecte tus datos, te lo informaremos y lo reportaremos a la autoridad cuando corresponda.',
        },
      ],
    },
    {
      heading: 'Con quién compartimos los datos',
      blocks: [
        {
          kind: 'paragraph',
          lead: 'No vendemos tus datos ni los cedemos a terceros con fines comerciales.',
          text: 'Solo intervienen proveedores tecnológicos que actúan por nuestra cuenta (encargados del tratamiento), necesarios para operar la plataforma:',
        },
        {
          kind: 'list',
          items: [
            { lead: 'Supabase:', text: 'base de datos y autenticación.' },
            {
              lead: '[Proveedor de alojamiento: Vercel / servidor de la universidad]:',
              text: 'publicación de la plataforma.',
            },
            { lead: 'Google:', text: 'solo si usas el inicio de sesión con Google.' },
            { lead: '[Servicio de envío de correos]:', text: 'solo para las invitaciones.' },
          ],
        },
        {
          kind: 'paragraph',
          text: 'También podemos divulgar datos si lo exige una autoridad competente.',
        },
      ],
    },
    {
      heading: 'Transferencias internacionales',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Algunos proveedores pueden almacenar datos fuera de Colombia. En ese caso nos aseguramos de que ofrezcan niveles adecuados de protección. [Indica el país del servidor cuando lo confirmes.]',
        },
      ],
    },
    {
      heading: 'Cookies y almacenamiento local',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Usamos únicamente el almacenamiento del navegador estrictamente necesario para mantener tu sesión iniciada. No usamos cookies publicitarias ni de seguimiento, y actualmente no usamos herramientas de analítica.',
        },
      ],
    },
    {
      heading: 'Decisiones automatizadas',
      blocks: [
        {
          kind: 'paragraph',
          text: 'No tomamos decisiones automatizadas que te afecten ni elaboramos perfiles. El puntaje y los logros del juego se calculan solo para mostrar tu progreso.',
        },
      ],
    },
    {
      heading: 'Cuánto tiempo conservamos tus datos',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Conservamos tus datos mientras tu cuenta esté activa. Si la eliminas o lo solicitas, borramos tus datos personales, salvo los que debamos conservar por obligación legal. Los datos usados con fines académicos se conservan codificados y agregados, y los archivos de la investigación se eliminan al concluir el proyecto, el 12 de noviembre de 2026, fecha de finalización del semestre.',
        },
      ],
    },
    {
      heading: 'Tus derechos',
      blocks: [
        { kind: 'paragraph', text: 'Como titular de los datos puedes:' },
        {
          kind: 'list',
          items: [
            { text: 'Conocer, actualizar y rectificar tus datos.' },
            { text: 'Solicitar prueba de la autorización que diste.' },
            { text: 'Ser informado sobre el uso que se ha dado a tus datos.' },
            {
              text: 'Revocar la autorización o solicitar la supresión de tus datos, cuando no haya un deber legal de conservarlos.',
            },
            { text: 'Acceder gratuitamente a tus datos.' },
            {
              text: 'Presentar quejas ante la Superintendencia de Industria y Comercio (SIC), autoridad de protección de datos en Colombia.',
            },
          ],
        },
        {
          kind: 'paragraph',
          text: 'Para ejercerlos, escríbenos a [correo de contacto]. Responderemos en los plazos que fija la ley.',
        },
      ],
    },
    {
      heading: 'Cambios a esta política',
      blocks: [
        {
          kind: 'paragraph',
          text: 'Podemos actualizar esta política por cambios en la plataforma o en la ley. La versión vigente estará siempre publicada aquí.',
        },
      ],
    },
  ],
};
