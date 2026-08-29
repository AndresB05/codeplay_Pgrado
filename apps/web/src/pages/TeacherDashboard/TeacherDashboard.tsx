import { useLocation, useParams } from 'react-router-dom';
import { TeacherGroupDetailModule } from '../../components/dashboard/teacher/TeacherGroupDetailModule';
import { TeacherGroupsModule } from '../../components/dashboard/teacher/TeacherGroupsModule';
import { TeacherPanelModule } from '../../components/dashboard/teacher/TeacherPanelModule';
import { TeacherSettingsModule } from '../../components/dashboard/teacher/TeacherSettingsModule';
import { TeacherSidebar } from '../../components/dashboard/teacher/TeacherSidebar';
import { TeacherTopBar } from '../../components/dashboard/teacher/TeacherTopBar';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { useClassrooms } from '../../hooks/useClassrooms';
import { FALLBACK_TEACHER_NAME } from '../../services/classrooms.service';

export const TeacherDashboard = () => {
  const location = useLocation();
  const { groupId } = useParams();
  const { loading: authLoading, user } = useAuth();
  const { groups, loading: classroomsLoading } = useClassrooms();

  /*
   * Se espera también a los salones: con la lista todavía vacía, el detalle
   * anunciaría que el salón no existe y el listado, que no hay ninguno.
   */
  if (authLoading || classroomsLoading) {
    return (
      <div className="jungle-surface flex min-h-screen items-center justify-center">
        <div className="h-14 w-14 animate-spin rounded-full border-[5px] border-line border-t-grape" />
      </div>
    );
  }

  const teacherName = user?.fullName || FALLBACK_TEACHER_NAME;

  const activeSection = location.pathname.startsWith(ROUTES.TEACHER_PANEL)
    ? ROUTES.TEACHER_PANEL
    : location.pathname.startsWith(ROUTES.TEACHER_SETTINGS)
      ? ROUTES.TEACHER_SETTINGS
      : ROUTES.TEACHER_GROUPS;

  const renderModule = () => {
    switch (activeSection) {
      case ROUTES.TEACHER_PANEL:
        return <TeacherPanelModule groups={groups} initialGroupId={groupId ?? null} />;
      case ROUTES.TEACHER_SETTINGS:
        return <TeacherSettingsModule user={user} groups={groups} />;
      default:
        return groupId ? (
          <TeacherGroupDetailModule groupId={groupId} />
        ) : (
          <TeacherGroupsModule groups={groups} teacherName={teacherName} />
        );
    }
  };

  return (
    <div className="jungle-surface min-h-screen text-ink">
      <TeacherTopBar user={user} />

      <div className="flex min-h-[calc(100vh-84px)]">
        <TeacherSidebar
          user={user}
          groups={groups}
          activeGroupId={activeSection === ROUTES.TEACHER_GROUPS ? (groupId ?? null) : null}
          activeSection={activeSection}
        />

        <main className="min-w-0 flex-1">{renderModule()}</main>
      </div>
    </div>
  );
};
