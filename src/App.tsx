import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { RoomExperience } from './components/RoomExperience';
import { BootScreen } from './components/BootScreen';
import { DesktopOS } from './components/os/DesktopOS';
import { SpeedInsights } from '@vercel/speed-insights/react';

function WorkspaceRouter() {
  const { experienceState } = useWorkspace();

  return (
    <div className="min-h-[100dvh] bg-[#07080D] text-[#F4F5F7]">
      {experienceState === 'DESKTOP' ? (
        <DesktopOS />
      ) : experienceState === 'BOOTING' ? (
        <>
          <RoomExperience />
          <BootScreen />
        </>
      ) : (
        <RoomExperience />
      )}
    </div>
  );
}

export default function App() {
  return (
    <WorkspaceProvider>
      <WorkspaceRouter />
      <SpeedInsights />
    </WorkspaceProvider>
  );
}
