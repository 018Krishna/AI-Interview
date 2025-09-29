import { Modal, Typography } from 'antd'
import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { selectCandidateById } from '@/features/candidates/selectors'
import { resumeInterview } from '@/features/candidates/thunks'
import { setActiveCandidate } from '@/features/candidates/candidatesSlice'
import {
  setCurrentTab,
  setWelcomeBackCandidate,
} from '@/features/ui/uiSlice'

const { Paragraph } = Typography

// --- Start of Inline CSS Styles ---

const modalStyle = {
  // Main modal container styles
  background: '#1F2937', // Dark gray background
  borderRadius: '16px',
  border: '1px solid #374151',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
};

const titleStyle = {
  // Title styles
  color: '#F9FAFB', // Light text color for contrast
  fontSize: '24px',
  fontWeight: '600',
  fontFamily: 'system-ui, sans-serif',
};

const paragraphStyle = {
  // Paragraph text styles
  color: '#9CA3AF', // Softer gray for body text
  fontSize: '16px',
  lineHeight: '1.6',
  fontFamily: 'system-ui, sans-serif',
};

const primaryButtonStyle = {
  // "Resume interview" button styles
  background: 'linear-gradient(270deg, #3672F8 0%, #9240FF 100%)', // Vibrant gradient
  border: 'none',
  color: '#FFFFFF',
  fontWeight: '600',
  height: '44px',
  padding: '0 24px',
  borderRadius: '12px',
  boxShadow: '0 4px 15px -5px rgba(146, 64, 255, 0.5)',
  transition: 'transform 0.2s ease-in-out', // Note: More complex transitions (like hover) are limited with inline styles
};

const secondaryButtonStyle = {
  // "Start fresh" button styles
  backgroundColor: '#374151', // Darker gray background
  border: 'none',
  color: '#F9FAFB',
  fontWeight: '500',
  height: '44px',
  padding: '0 24px',
  borderRadius: '12px',
};

// --- End of Inline CSS Styles ---


export function WelcomeBackModal() {
  const dispatch = useAppDispatch()
  const candidateId = useAppSelector((state) => state.ui.welcomeBackCandidateId)
  const candidate = useAppSelector((state) =>
    candidateId ? selectCandidateById(candidateId)(state) : undefined,
  )

  const closeModal = useCallback(() => {
    dispatch(setWelcomeBackCandidate(undefined))
  }, [dispatch])

  const handleResume = useCallback(() => {
    if (!candidate) return
    dispatch(setActiveCandidate(candidate.id))
    dispatch(setCurrentTab('interviewee'))
    dispatch(resumeInterview())
    closeModal()
  }, [candidate, closeModal, dispatch])

  const handleStartFresh = useCallback(() => {
    closeModal()
    dispatch(setCurrentTab('interviewee'))
    dispatch(setActiveCandidate(undefined))
  }, [closeModal, dispatch])

  return (
    <Modal
      title={<div style={titleStyle}>Welcome Back! 👋</div>}
      open={Boolean(candidate)}
      onOk={handleResume}
      onCancel={handleStartFresh}
      okText="Resume Interview"
      cancelText="Start Fresh"
      centered
      // Applying styles to the modal and its buttons
      styles={{
        content: modalStyle,
        header: {
          backgroundColor: '#1F2937', // Match modal background
          borderBottom: '1px solid #374151',
          padding: '24px',
          borderRadius: '16px 16px 0 0',
        },
        body: {
          padding: '24px',
        },
        footer: {
          borderTop: '1px solid #374151', // Match header border
          padding: '16px 24px',
          borderRadius: '0 0 16px 16px',
        },
        mask: {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(10, 10, 20, 0.5)',
        }
      }}
      okButtonProps={{ style: primaryButtonStyle }}
      cancelButtonProps={{ style: secondaryButtonStyle }}
      closable={false} // Hiding the default 'x' for a cleaner look
    >
      <Paragraph style={paragraphStyle}>
        {candidate?.profile.name
          ? `Hey ${candidate.profile.name}, it's great to see you again.`
          : 'Hey there, great to see you again.'}
      </Paragraph>
      <Paragraph style={paragraphStyle}>
        We saved your progress from the last session. Do you want to resume right
        where you left off, or start a new interview?
      </Paragraph>
    </Modal>
  )
}

export default WelcomeBackModal