import { useLocation, useParams } from 'react-router-dom';
import { Sidebar } from '../../components/dashboard/Sidebar/Sidebar';
import { StudentClassroomModule } from '../../components/dashboard/student/StudentClassroomModule';
import { StudentSettingsModule } from '../../components/dashboard/student/StudentSettingsModule';
import { StudentTopBar } from '../../components/dashboard/student/StudentTopBar';
import { StudentTrophiesModule } from '../../components/dashboard/student/StudentTrophiesModule';
import { StudentWorldLevelsModule } from '../../components/dashboard/student/StudentWorldLevelsModule';
import { StudentWorldsModule } from '../../components/dashboard/student/StudentWorldsModule';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';

export const Dashboard = () => {
  const location = useLocation();
  const { worldId } = useParams();
  const { loading: authLoading, user } = useAuth();

  const activeRoute =
    location.pathname === ROUTES.DASHBOARD || location.pathname.startsWith(`${ROUTES.WORLDS}/`)
      ? ROUTES.WORLDS
      : location.pathname;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F3FA]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#8B5CF6]" />
      </div>
    );
  }

  const renderStudentModule = () => {
    switch (activeRoute) {
      case ROUTES.WORLDS:
        return worldId ? (
          <StudentWorldLevelsModule worldId={worldId} />
        ) : (
          <StudentWorldsModule user={user} />
        );
      case ROUTES.TROPHY_ROOM:
        return <StudentTrophiesModule />;
      case ROUTES.CLASSROOM:
        return <StudentClassroomModule />;
      case ROUTES.SETTINGS:
        return <StudentSettingsModule user={user} />;
      default:
        return <StudentWorldsModule user={user} />;
    }
  };

  const showSidebar = activeRoute !== ROUTES.SETTINGS;

  return (
    <div className="min-h-screen bg-[#F6F3FA] text-[#231F2D]">
      <StudentTopBar user={user} />

      <div className={`min-h-[calc(100vh-78px)] ${showSidebar ? 'flex' : 'block'}`}>
        {showSidebar ? <Sidebar user={user} activeRoute={activeRoute} /> : null}

        <main className="min-w-0 flex-1">{renderStudentModule()}</main>
      </div>
    </div>
  );
};
