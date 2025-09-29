import { InboxOutlined } from '@ant-design/icons'
import { Card, Typography, Upload, message } from 'antd'
import type { CSSProperties } from 'react'
import type { UploadProps } from 'antd'

const { Dragger } = Upload

interface ResumeUploadCardProps {
  onUpload: (file: File) => Promise<void> | void
  loading?: boolean
}

const ACCEPT = '.pdf,.docx'

export function ResumeUploadCard({ onUpload, loading }: ResumeUploadCardProps) {
  const props: UploadProps = {
    multiple: false,
    accept: ACCEPT,
    showUploadList: false,
    beforeUpload: async (file) => {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!extension || !['pdf', 'docx'].includes(extension)) {
        message.error('Please upload a PDF or DOCX resume.')
        return Upload.LIST_IGNORE
      }

      try {
        await onUpload(file as File)
      } catch (error) {
        console.error(error)
        message.error(
          error instanceof Error
            ? error.message
            : 'Failed to read the resume. Please try again.',
        )
      }

      return Upload.LIST_IGNORE
    },
    disabled: loading,
  }

  // --- Modern Inline Styles ---

  const cardStyle: CSSProperties = {
    maxWidth: 600,
    margin: '40px auto',
    background: 'linear-gradient(135deg, #1f2937, #111827)', // Dark slate gradient
    borderRadius: '24px',
    border: 'none',
    padding: '40px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', // Deeper, softer shadow
    color: '#e5e7eb', // Light text for contrast
  }

  const titleStyle: CSSProperties = {
    textAlign: 'center',
    color: '#ffffff',
    fontWeight: 600,
    marginBottom: '12px',
  }

  const paragraphStyle: CSSProperties = {
    textAlign: 'center',
    color: '#9ca3af', // Muted gray for secondary text
    maxWidth: '450px',
    margin: '0 auto 32px auto', // Center the block with more bottom margin
  }

  const draggerStyle: CSSProperties = {
    // Frosted glass effect
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)', // For Safari compatibility
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '40px 20px',
    transition: 'all 0.3s ease',
    cursor: loading ? 'not-allowed' : 'pointer',
  }

  const iconStyle: CSSProperties = {
    fontSize: '60px',
    color: '#38bdf8', // Vibrant sky blue accent
  }

  const uploadTextStyle: CSSProperties = {
    color: '#f9fafb',
    fontSize: '18px',
    fontWeight: 500,
  }

  const uploadHintStyle: CSSProperties = {
    color: '#9ca3af',
    fontSize: '14px',
    marginTop: '12px',
  }

  return (
    <Card style={cardStyle} bordered={false}>
      <Typography.Title level={2} style={titleStyle}>
        Upload Your Resume
      </Typography.Title>
      <Typography.Paragraph style={paragraphStyle}>
        We&apos;ll extract your key details automatically. You can review and
        edit everything before the interview begins.
      </Typography.Paragraph>
      <Dragger {...props} style={draggerStyle}>
        <p>
          <InboxOutlined style={iconStyle} />
        </p>
        <p style={uploadTextStyle}>
          Click or drag PDF / DOCX file to this area
        </p>
        <p style={uploadHintStyle}>
          Your data stays private in your browser. It's only used to
          personalize your interview experience.
        </p>
      </Dragger>
    </Card>
  )
}

export default ResumeUploadCard