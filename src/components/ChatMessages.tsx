import { Typography, Tag, Avatar } from 'antd'
import { UserOutlined, RobotOutlined } from '@ant-design/icons'
import type { ChatMessage } from '@/types'
import './ChatMessages.css'

const { Text } = Typography

interface ChatMessagesProps {
  messages: ChatMessage[]
}

// Define labels and avatars in one place for easier management
const senderConfig = {
  assistant: {
    label: 'Assistant',
    icon: <RobotOutlined />,
    avatarClass: 'assistant-avatar',
  },
  candidate: {
    label: 'You',
    icon: <UserOutlined />,
    avatarClass: 'candidate-avatar',
  },
  system: {
    label: 'System',
    icon: <RobotOutlined />, // Or another icon for system messages
    avatarClass: 'system-avatar',
  },
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="chat-window">
      {messages.map((message) => {
        const config = senderConfig[message.sender]
        return (
          <div
            key={message.id}
            className={`chat-message chat-message--${message.sender}`}
          >
            <div className="chat-message__avatar">
              <Avatar
                className={`avatar ${config.avatarClass}`}
                icon={config.icon}
              />
            </div>

            <div className="chat-message__content-wrapper">
              <div className="chat-message__header">
                <Text strong>{config.label}</Text>
                <span className="chat-message__timestamp">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="chat-message__bubble">
                {message.kind === 'question' && (
                  <Tag color="blue" className="chat-message__tag">
                    Question
                  </Tag>
                )}
                {message.kind === 'summary' && (
                  <Tag color="green" className="chat-message__tag">
                    Summary
                  </Tag>
                )}
                <Text>{message.content}</Text>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ChatMessages