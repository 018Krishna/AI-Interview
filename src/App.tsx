import { useEffect, useMemo, CSSProperties } from 'react'
import { Layout, Tabs, Typography, Badge } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import IntervieweeView from '@/features/interviewee/IntervieweeView'
import InterviewerView from '@/features/interviewer/InterviewerView'
import WelcomeBackModal from '@/components/WelcomeBackModal'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import {
  selectActiveCandidate,
  selectCandidatesList,
} from '@/features/candidates/selectors'
import { pauseInterview } from '@/features/candidates/thunks'
import {
  setCurrentTab,
  setWelcomeBackCandidate,
} from '@/features/ui/uiSlice'

const { Header, Content } = Layout
const { Title } = Typography

// --- STYLES (as JavaScript Objects) ---
const styles: { [key: string]: CSSProperties } = {
  appLayout: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
  },
  appHeader: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #dee2e6',
    padding: '0 48px',
    height: '72px',
    display: 'flex',
    alignItems: 'center',
  },
  appTitle: {
    margin: 0,
    color: '#212529',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  appContent: {
    padding: '24px 48px 48px',
  },
  mainContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  tabLabel: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#6c757d',
    padding: '8px 4px',
    transition: 'color 0.2s ease',
  },
  activeTabLabel: {
    color: '#5e5ce6',
  },
  badge: {
    backgroundColor: '#e9ecef',
    color: '#495057',
    fontWeight: 600,
    marginLeft: '8px',
    boxShadow: 'none',
  },
}

// --- COMPONENT ---
function App() {
  const dispatch = useAppDispatch()
  const currentTab = useAppSelector((state) => state.ui.currentTab)
  const candidates = useAppSelector(selectCandidatesList)
  const activeCandidate = useAppSelector(selectActiveCandidate)
  const welcomeBackId = useAppSelector(
    (state) => state.ui.welcomeBackCandidateId,
  )

  useEffect(() => {
    if (
      activeCandidate &&
      activeCandidate.interview.status === 'paused' &&
      !welcomeBackId
    ) {
      dispatch(setWelcomeBackCandidate(activeCandidate.id))
    }
  }, [activeCandidate, dispatch, welcomeBackId])

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (
        activeCandidate &&
        activeCandidate.interview.status === 'in-progress'
      ) {
        dispatch(pauseInterview())
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [activeCandidate, dispatch])

  const tabItems = useMemo(
    () => [
      {
        key: 'interviewee',
        label: (
          <span
            style={{
              ...styles.tabLabel,
              ...(currentTab === 'interviewee' && styles.activeTabLabel),
            }}
          >
            Interviewee
          </span>
        ),
        children: <IntervieweeView />,
      },
      {
        key: 'interviewer',
        label: (
          <span
            style={{
              ...styles.tabLabel,
              ...(currentTab === 'interviewer' && styles.activeTabLabel),
            }}
          >
            Interviewer{' '}
            <Badge
              count={candidates.length}
              size="small"
              style={styles.badge}
            />
          </span>
        ),
        children: <InterviewerView />,
      },
    ],
    [candidates.length, currentTab],
  )

  return (
    <Layout style={styles.appLayout}>
      <Header style={styles.appHeader}>
        <Title level={3} style={styles.appTitle}>
          <RobotOutlined style={{ color: '#5e5ce6' }} />
          <span>AI-Powered Interview Assistant</span>
        </Title>
      </Header>
      <Content style={styles.appContent}>
        <div style={styles.mainContainer}>
          <Tabs
            items={tabItems}
            activeKey={currentTab}
            onChange={(key) =>
              dispatch(setCurrentTab(key as 'interviewee' | 'interviewer'))
            }
            // Note: Styling the ink bar requires CSS classes or styled-components
            // as Ant Design does not expose a simple style prop for it.
            // The active text color provides a clear indication.
          />
        </div>
      </Content>
      <WelcomeBackModal />
    </Layout>
  )
}

export default App