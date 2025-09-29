import {
  useCallback,
  useMemo,
  useRef,
  useState,
  CSSProperties,
} from 'react'
import {
  Alert,
  Button,
  Form,
  Input,
  Row,
  Col,
  Space,
  Statistic,
  Typography,
  message,
  Tag,
} from 'antd'
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  UserOutlined,
  SendOutlined,
} from '@ant-design/icons'
import TextArea from 'antd/es/input/TextArea'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { ResumeUploadCard } from '@/components/ResumeUploadCard' // Assumes this is styled
import ChatMessages from '@/components/ChatMessages' // Assumes this is styled
import QuestionTimer from '@/components/QuestionTimer' // Assumes this is styled with inline CSS
import {
  selectActiveCandidate,
  selectCurrentQuestion,
  selectInterviewProgress,
  selectOutstandingProfileFields,
} from '@/features/candidates/selectors'
import {
  ingestResume,
  pauseInterview,
  resumeInterview,
  startInterview,
  submitAnswer,
  submitProfileField,
} from '@/features/candidates/thunks'

const { Title, Paragraph, Text } = Typography

// --- STYLES (as JavaScript Objects) ---
const styles: { [key: string]: CSSProperties } = {
  pageContainer: {
    backgroundColor: '#f8f9fa',
    padding: '24px',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
  },
  headerCard: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #e9ecef',
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerAvatar: {
    backgroundColor: '#e9ecef',
    color: '#495057',
    padding: '12px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '16px',
  },
  headerTitle: {
    margin: 0,
    fontWeight: 600,
    fontSize: '22px',
    color: '#212529',
  },
  headerSubtitle: {
    margin: 0,
    color: '#6c757d',
    fontSize: '14px',
  },
  progressContainer: {
    textAlign: 'right',
  },
  progressText: {
    fontSize: '14px',
    color: '#495057',
    marginBottom: '8px',
    fontWeight: 500,
  },
  progressBarOuter: {
    backgroundColor: '#e9ecef',
    height: '8px',
    borderRadius: '4px',
    width: '150px',
  },
  progressBarInner: {
    backgroundColor: '#5e5ce6',
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  cardBase: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #e9ecef',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
    width: '100%',
    marginBottom: '24px',
  },
  chatCardBody: {
    padding: 0,
    maxHeight: '60vh',
    overflowY: 'auto',
  },
  actionPanelTitle: {
    fontWeight: 600,
    color: '#343a40',
    marginBottom: '16px',
  },
  buttonPrimary: {
    backgroundColor: '#5e5ce6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 500,
    transition: 'background-color 0.2s ease',
  },
  buttonPrimaryHover: {
    backgroundColor: '#4d4acb',
  },
  buttonSecondary: {
    backgroundColor: '#f1f3f5',
    color: '#495057',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    fontWeight: 500,
    transition: 'background-color 0.2s ease, border-color 0.2s ease',
  },
  buttonSecondaryHover: {
    backgroundColor: '#e9ecef',
    borderColor: '#ced4da',
  },
  textArea: {
    borderRadius: '8px',
    borderColor: '#ced4da',
    padding: '12px',
    fontSize: '15px',
    minHeight: '150px',
  },
  input: {
    borderRadius: '8px',
    borderColor: '#ced4da',
    padding: '10px 12px',
    fontSize: '15px',
  },
  summaryScore: {
    color: '#5e5ce6',
  },
  summaryTag: {
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '13px',
    border: 'none',
  },
  finalRemark: {
    backgroundColor: '#e6f7ff',
    border: '1px solid #91d5ff',
    borderRadius: '8px',
  },
}

// --- COMPONENT ---

export function IntervieweeView() {
  const dispatch = useAppDispatch()
  const candidate = useAppSelector(selectActiveCandidate)
  const missingFields = useAppSelector(selectOutstandingProfileFields)
  const currentQuestion = useAppSelector(selectCurrentQuestion)
  const progress = useAppSelector(selectInterviewProgress)

  // Component State
  const [uploading, setUploading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [collectingField, setCollectingField] = useState(false)
  const [answer, setAnswer] = useState('')
  const [submittingAnswer, setSubmittingAnswer] = useState(false)
  const [pausing, setPausing] = useState(false)
  const [resuming, setResuming] = useState(false)
  
  // Hover states for inline styles
  const [startHover, setStartHover] = useState(false);
  const [submitHover, setSubmitHover] = useState(false);
  const [clearHover, setClearHover] = useState(false);
  const [pauseHover, setPauseHover] = useState(false);
  const [resumeHover, setResumeHover] = useState(false);

  const answerRef = useRef(answer)
  answerRef.current = answer

  const status = candidate?.interview.status
  const canUpload = !candidate || status === 'completed'

  // --- Handlers ---
  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true)
      try {
        await dispatch(ingestResume({ file })).unwrap()
        message.success('Resume processed successfully!')
      } catch (error) {
        message.error(
          error instanceof Error
            ? error.message
            : 'Could not process the resume.',
        )
      } finally {
        setUploading(false)
      }
    },
    [dispatch],
  )

  const handleProfileSubmit = useCallback(
    async (values: { response: string }) => {
      if (!missingFields.length) return
      setCollectingField(true)
      try {
        await dispatch(
          submitProfileField({ field: missingFields[0], value: values.response }),
        ).unwrap()
      } finally {
        setCollectingField(false)
      }
    },
    [dispatch, missingFields],
  )

  const handleStartInterview = useCallback(async () => {
    setStarting(true)
    try {
      await dispatch(startInterview()).unwrap()
    } catch (error) {
      if (error instanceof Error) message.error(error.message)
    } finally {
      setStarting(false)
    }
  }, [dispatch])

  const handleSubmitAnswer = useCallback(async () => {
    if (!answer.trim()) {
      message.warning('Please provide an answer before submitting.')
      return
    }
    setSubmittingAnswer(true)
    try {
      await dispatch(
        submitAnswer({ response: answer.trim(), autoSubmitted: false }),
      ).unwrap()
      setAnswer('')
    } catch (error) {
      message.error('Could not submit your answer. Please try again.')
    } finally {
      setSubmittingAnswer(false)
    }
  }, [answer, dispatch])

  const handleTimerExpired = useCallback(() => {
    dispatch(
      submitAnswer({
        response: answerRef.current,
        autoSubmitted: true,
      }),
    )
    setAnswer('')
  }, [dispatch])

  const handlePauseInterview = useCallback(async () => {
    setPausing(true)
    try {
      await dispatch(pauseInterview()).unwrap()
      message.info('Interview paused.')
    } catch (error) {
      message.error('Could not pause the interview.')
    } finally {
      setPausing(false)
    }
  }, [dispatch])

  const handleResumeInterview = useCallback(async () => {
    setResuming(true)
    try {
      await dispatch(resumeInterview()).unwrap()
      message.success('Welcome back! Resuming interview.')
    } catch (error) {
      message.error('Could not resume the interview.')
    } finally {
      setResuming(false)
    }
  }, [dispatch])

  // --- Memoized Values ---
  const profileSummary = useMemo(() => {
    if (!candidate) return null
    return [
      candidate.profile.email ? `Email: ${candidate.profile.email}` : null,
      candidate.profile.phone ? `Phone: ${candidate.profile.phone}` : null,
    ]
      .filter(Boolean)
      .join(' · ')
  }, [candidate])

  const progressPercent = useMemo(() => {
    if (!progress.total) return 0
    return (progress.answered / progress.total) * 100
  }, [progress])

  // --- Render ---

  if (!candidate) {
    return (
      <div style={styles.pageContainer}>
        <ResumeUploadCard onUpload={handleUpload} loading={uploading} />
      </div>
    )
  }

  return (
    <div style={styles.pageContainer}>
      <header style={styles.headerCard}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={styles.headerAvatar}>
            <UserOutlined style={{ fontSize: '24px' }} />
          </div>
          <div>
            <h1 style={styles.headerTitle}>
              {candidate.profile.name || 'AI Interview Session'}
            </h1>
            {profileSummary && (
              <p style={styles.headerSubtitle}>{profileSummary}</p>
            )}
          </div>
        </div>
        <div style={styles.progressContainer}>
          <p style={styles.progressText}>
            Progress: {progress.answered}/{progress.total || 6}
          </p>
          <div style={styles.progressBarOuter}>
            <div
              style={{
                ...styles.progressBarInner,
                width: `${progressPercent}%`,
              }}
            />
          </div>
        </div>
      </header>

      <Row gutter={24}>
        <Col xs={24} lg={14}>
          <div style={{...styles.cardBase, ...styles.chatCardBody}}>
             <ChatMessages messages={candidate.chat} />
          </div>
        </Col>

        <Col xs={24} lg={10}>
          {status === 'collecting' && missingFields.length > 0 && (
            <div style={styles.cardBase}>
              <Title level={4} style={styles.actionPanelTitle}>
                Provide your {missingFields[0]}
              </Title>
              <Form layout="vertical" onFinish={handleProfileSubmit}>
                <Form.Item
                  name="response"
                  rules={[{ required: true, message: 'This field is required.' }]}
                >
                  <Input
                    style={styles.input}
                    placeholder={`Enter your ${missingFields[0]}`}
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={collectingField}
                    style={styles.buttonPrimary}
                  >
                    Submit
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}

          {status === 'awaiting-start' && (
            <div style={styles.cardBase}>
              <Title level={4} style={styles.actionPanelTitle}>
                Ready to Begin?
              </Title>
              <Paragraph style={{ color: '#495057' }}>
                You'll face 6 questions with increasing difficulty. Timers will
                auto-submit your answer when time is up. Good luck!
              </Paragraph>
              <Button
                type="primary"
                onClick={handleStartInterview}
                loading={starting}
                style={{ ...styles.buttonPrimary, ...(startHover && styles.buttonPrimaryHover) }}
                onMouseEnter={() => setStartHover(true)}
                onMouseLeave={() => setStartHover(false)}
              >
                Start Interview
              </Button>
            </div>
          )}

          {status === 'in-progress' && currentQuestion && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={styles.cardBase}>
                <QuestionTimer
                  timer={candidate.interview.activeTimer}
                  difficulty={currentQuestion.difficulty}
                  onExpired={handleTimerExpired}
                />
              </div>
              <div style={styles.cardBase}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <Title level={4} style={{...styles.actionPanelTitle, marginBottom: 0}}>
                        Your Answer
                    </Title>
                    <Button
                        icon={<PauseCircleOutlined />}
                        onClick={handlePauseInterview}
                        loading={pausing}
                        style={{ ...styles.buttonSecondary, ...(pauseHover && styles.buttonSecondaryHover) }}
                        onMouseEnter={() => setPauseHover(true)}
                        onMouseLeave={() => setPauseHover(false)}
                    >
                        Pause
                    </Button>
                </div>
                <Paragraph type="secondary" style={{ marginBottom: '16px' }}>
                  {currentQuestion.prompt}
                </Paragraph>
                <TextArea
                  style={styles.textArea}
                  rows={8}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Share your thought process, trade-offs, and examples."
                />
                <Space style={{ marginTop: '16px' }}>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSubmitAnswer}
                    loading={submittingAnswer}
                    style={{ ...styles.buttonPrimary, ...(submitHover && styles.buttonPrimaryHover) }}
                    onMouseEnter={() => setSubmitHover(true)}
                    onMouseLeave={() => setSubmitHover(false)}
                  >
                    Submit Answer
                  </Button>
                  <Button 
                    onClick={() => setAnswer('')} 
                    disabled={submittingAnswer}
                    style={{ ...styles.buttonSecondary, ...(clearHover && styles.buttonSecondaryHover) }}
                    onMouseEnter={() => setClearHover(true)}
                    onMouseLeave={() => setClearHover(false)}
                  >
                    Clear
                  </Button>
                </Space>
              </div>
            </Space>
          )}
          
          {status === 'paused' && (
             <div style={styles.cardBase}>
                <Title level={4} style={styles.actionPanelTitle}>Interview Paused</Title>
                 <Alert
                    message="Take your time. Resume when you're ready to pick up where you left off."
                    type="warning"
                    showIcon
                    style={{marginBottom: '16px'}}
                 />
                 <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={handleResumeInterview}
                    loading={resuming}
                    style={{ ...styles.buttonPrimary, ...(resumeHover && styles.buttonPrimaryHover) }}
                    onMouseEnter={() => setResumeHover(true)}
                    onMouseLeave={() => setResumeHover(false)}
                 >
                    Resume Interview
                 </Button>
             </div>
          )}
          
          {status === 'completed' && candidate.summary && (
             <div style={styles.cardBase}>
                 <Title level={4} style={styles.actionPanelTitle}>Interview Summary</Title>
                 <Statistic
                    title="Final Score"
                    value={candidate.summary.overallScore}
                    suffix="/ 100"
                    valueStyle={styles.summaryScore}
                 />
                 <div style={{marginTop: '24px'}}>
                     <Title level={5}>Strengths</Title>
                     <Space size={[8, 8]} wrap>
                         {candidate.summary.strengths.map((item) => (
                             <Tag key={item} color="green" style={styles.summaryTag}>{item}</Tag>
                         ))}
                     </Space>
                 </div>
                  <div style={{marginTop: '16px'}}>
                     <Title level={5}>Areas to Improve</Title>
                     <Space size={[8, 8]} wrap>
                         {candidate.summary.areasToImprove.map((item) => (
                             <Tag key={item} color="orange" style={styles.summaryTag}>{item}</Tag>
                         ))}
                     </Space>
                 </div>
                 <Alert
                    message="Final Remark"
                    description={candidate.summary.finalRemark}
                    type="success"
                    showIcon
                    style={{...styles.finalRemark, marginTop: '24px'}}
                 />
             </div>
          )}

          {canUpload && (
            <div style={{ marginTop: '24px' }}>
              <ResumeUploadCard
                onUpload={handleUpload}
                loading={uploading}
              />
            </div>
          )}
        </Col>
      </Row>
    </div>
  )
}

export default IntervieweeView