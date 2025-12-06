import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import secrets

# Gmail SMTP Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")  # Use Gmail App Password
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def generate_participant_token(participant_id: int, event_id: int) -> str:
    """Generate a secure token for participant certificate generation"""
    # Create a predictable but secure token (can be enhanced with JWT if needed)
    random_part = secrets.token_urlsafe(32)
    return f"{event_id}_{participant_id}_{random_part}"


async def send_certificate_link_email(
    participant_email: str,
    participant_name: str,
    event_name: str,
    token: str
) -> bool:
    """Send certificate generation link to participant via email"""
    
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        raise ValueError("SMTP credentials not configured. Set SMTP_EMAIL and SMTP_PASSWORD in .env")
    
    if not participant_email:
        return False
    
    # Create certificate generation link
    cert_link = f"{FRONTEND_URL}/student/{token}"
    
    # Email content
    subject = f"🎓 Your Certificate for {event_name}"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
            }}
            .content {{
                background: #ffffff;
                padding: 30px;
                border: 1px solid #e0e0e0;
                border-top: none;
            }}
            .button {{
                display: inline-block;
                padding: 15px 30px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                margin: 20px 0;
            }}
            .footer {{
                background: #f5f5f5;
                padding: 20px;
                border-radius: 0 0 10px 10px;
                text-align: center;
                font-size: 12px;
                color: #666;
            }}
            .emoji {{
                font-size: 48px;
                margin: 10px 0;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="emoji">🎓</div>
            <h1 style="margin: 10px 0;">Certificate Ready!</h1>
        </div>
        <div class="content">
            <p>Dear <strong>{participant_name}</strong>,</p>
            
            <p>Congratulations! Your certificate for <strong>{event_name}</strong> is ready to be generated.</p>
            
            <p>Click the button below to view and download your certificate:</p>
            
            <div style="text-align: center;">
                <a href="{cert_link}" class="button">
                    📜 Generate My Certificate
                </a>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                <strong>Note:</strong> This link is unique to you. Please keep it secure and do not share it with others.
            </p>
            
            <p style="font-size: 14px; color: #666;">
                If you have any questions, please contact your event organizer.
            </p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2025 Certificate Management System</p>
        </div>
    </body>
    </html>
    """
    
    text_body = f"""
    Dear {participant_name},
    
    Congratulations! Your certificate for {event_name} is ready to be generated.
    
    Click this link to view and download your certificate:
    {cert_link}
    
    Note: This link is unique to you. Please keep it secure and do not share it with others.
    
    If you have any questions, please contact your event organizer.
    
    ---
    This is an automated message. Please do not reply to this email.
    © 2025 Certificate Management System
    """
    
    # Create message
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = SMTP_EMAIL
    message["To"] = participant_email
    
    # Attach both text and HTML versions
    part1 = MIMEText(text_body, "plain")
    part2 = MIMEText(html_body, "html")
    message.attach(part1)
    message.attach(part2)
    
    # Send email
    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(message)
        return True
    except Exception as e:
        print(f"Failed to send email to {participant_email}: {str(e)}")
        return False


def decode_participant_token(token: str) -> Optional[tuple[int, int]]:
    """Decode participant token to extract event_id and participant_id"""
    try:
        parts = token.split("_")
        if len(parts) >= 3:
            event_id = int(parts[0])
            participant_id = int(parts[1])
            return (event_id, participant_id)
    except (ValueError, IndexError):
        pass
    return None
