import { StreakBadge } from '../shared/StreakBadge.jsx';
import { TabSwitcher } from './TabSwitcher.jsx';
import { ProgressBar } from './ProgressBar.jsx';
import { PhasePills } from './PhasePills.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';

const LOGOS = {
  nt: { cls: 'mode-nt', text: 'NT PROTOCOL' },
  gut: { cls: 'mode-gut', text: 'GUT PROTOCOL' },
  diet: { cls: 'mode-diet', text: 'DIET PROTOCOL' },
  workout: { cls: 'mode-workout', text: 'TRAIN' },
};

export function StickyHeader({
  tab,
  setTab,
  user,
  onSignOut,
  onConnectAccount,
  progress,
  phases,
  streakCount,
  scrollToPhase,
  isLight,
  toggleTheme,
}) {
  const hideTrackingUI = tab === 'diet' || tab === 'workout';
  const logo = LOGOS[tab] || LOGOS.nt;
  const isAnonymous = user?.is_anonymous === true;
  const displayName = isAnonymous
    ? 'guest'
    : user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split('@')[0] ||
      'you';
  const avatar =
    !isAnonymous && (user?.user_metadata?.avatar_url || user?.user_metadata?.picture);
  const initials = (displayName || '?').slice(0, 1).toUpperCase();

  return (
    <div className="sticky-header">
      <div className="header-top">
        <div className={`logo ${logo.cls}`}>{logo.text}</div>
        <div className="header-right">
          {!hideTrackingUI && <StreakBadge count={streakCount} tab={tab} />}
          <ThemeToggle isLight={isLight} onToggle={toggleTheme} />
          <div className="user-chip" title={displayName}>
            {avatar ? (
              <img className="user-avatar" src={avatar} alt="" referrerPolicy="no-referrer" />
            ) : (
              <div className="user-avatar-fallback">{initials}</div>
            )}
            <span className="user-name">{displayName}</span>
          </div>
          {isAnonymous && onConnectAccount && (
            <button
              type="button"
              className="connect-btn"
              onClick={onConnectAccount}
              title="Connect an email or Google account to sync across devices"
            >
              🔗 CONNECT
            </button>
          )}
          <button type="button" className="signout-btn" onClick={onSignOut}>
            OUT
          </button>
        </div>
      </div>

      <TabSwitcher tab={tab} setTab={setTab} />

      {!hideTrackingUI && (
        <>
          <ProgressBar tab={tab} progress={progress} />
          <PhasePills tab={tab} phases={phases} onPillClick={scrollToPhase} />
        </>
      )}
    </div>
  );
}
