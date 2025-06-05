import React from "react";
import "./ChatBotSection.css";

interface ChatBotSectionProps {
    heightPercent: number;
    onHeightChange: (percent: number) => void;
    children?: React.ReactNode;
}

const ChatBotSection: React.FC<ChatBotSectionProps> = ({
    heightPercent,
    children,
}) => {
    return (
        <div className="chatbot-section" style={{ height: `${heightPercent}vh` }}>
            {children}
        </div>
    );
};

export default ChatBotSection; 