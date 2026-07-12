import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.config import settings

SMTP_HOST = settings.SMTP_HOST
SMTP_PORT = settings.SMTP_PORT
SMTP_USER = settings.SMTP_USER
SMTP_PASSWORD = settings.SMTP_PASSWORD
SMTP_FROM = settings.SMTP_FROM

def send_email(to_email: str, subject: str, body: str):
    """Utility to send email via SMTP, falls back to printing to console if SMTP is unavailable."""
    msg = MIMEMultipart()
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    # Print to console for logging/debugging (crucial for local testing)
    print(f"\n==================================================")
    print(f"EMAIL SENT TO: {to_email}")
    print(f"SUBJECT: {subject}")
    print(f"BODY:\n{body}")
    print(f"==================================================\n")

    # Only attempt smtplib if SMTP_HOST is customized or not mock
    if SMTP_HOST == "localhost" and SMTP_PORT == 1025:
        # standard fallback local printing only
        return True

    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        if SMTP_USER and SMTP_PASSWORD:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM, to_email, msg.as_string())
        server.close()
        return True
    except Exception as e:
        print(f"[MAILER WARNING] Failed to send email via SMTP ({e}). Displayed in console instead.")
        return False

def send_otp_email(email: str, otp: str, purpose: str = "verify"):
    if purpose == "verify":
        subject = "TransitOps - Verify Your Email"
        body = f"Welcome to TransitOps!\n\nYour 6-digit email verification OTP code is: {otp}\n\nThis code will expire in 10 minutes."
    else:
        subject = "TransitOps - Reset Your Password"
        body = f"You requested a password reset for your TransitOps account.\n\nYour 6-digit password reset OTP code is: {otp}\n\nThis code will expire in 10 minutes."
    return send_email(email, subject, body)

def send_document_expiry_email(email: str, asset_name: str, doc_name: str, days_left: int, expiry_date_str: str):
    subject = f"TransitOps Alert: Compliance Expiry Warning ({asset_name})"
    body = (
        f"Dear Manager,\n\n"
        f"This is a compliance reminder that the safety document '{doc_name}' for '{asset_name}' "
        f"is about to expire in {days_left} days on {expiry_date_str}.\n\n"
        f"Please update and re-submit this document for audit in the TransitOps portal to prevent asset suspension."
    )
    return send_email(email, subject, body)
