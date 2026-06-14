import logging
from concurrent.futures import ThreadPoolExecutor
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction

from .models import Notification, EmailLog, AuditLog, NotificationSetting

logger = logging.getLogger(__name__)

# ThreadPoolExecutor for background async processing
_executor = ThreadPoolExecutor(max_workers=5)

def get_base_html_template(title, body_content, button_text=None, button_url=None):
    """
    Renders a responsive, professional HTML email template with TaleemPro styling.
    """
    btn_html = ""
    if button_text and button_url:
        btn_html = f"""
        <table border="0" cellpadding="0" cellspacing="0" class="btn btn-primary" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; box-sizing: border-box;">
          <tbody>
            <tr>
              <td align="center" style="font-family: sans-serif; font-size: 14px; vertical-align: top; padding-bottom: 15px;">
                <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: auto;">
                  <tbody>
                    <tr>
                      <td style="font-family: sans-serif; font-size: 14px; vertical-align: top; background-color: #4f46e5; border-radius: 6px; text-align: center;">
                        <a href="{button_url}" target="_blank" style="display: inline-block; color: #ffffff; background-color: #4f46e5; border: solid 1px #4f46e5; border-radius: 6px; box-sizing: border-box; cursor: pointer; text-decoration: none; font-size: 14px; font-weight: bold; margin: 0; padding: 12px 25px; text-transform: capitalize; border-color: #4f46e5;">{button_text}</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        """
        
    return f"""
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>{title}</title>
        <style>
        @media only screen and (max-width: 620px) {{
          table[class=body] h1 {{
            font-size: 28px !important;
            margin-bottom: 10px !important;
          }}
          table[class=body] p,
          table[class=body] ul,
          table[class=body] ol,
          table[class=body] td,
          table[class=body] span,
          table[class=body] a {{
            font-size: 16px !important;
          }}
          table[class=body] .wrapper,
          table[class=body] .article {{
            padding: 10px !important;
          }}
          table[class=body] .content {{
            padding: 0 !important;
          }}
          table[class=body] .container {{
            padding: 0 !important;
            width: 100% !important;
          }}
          table[class=body] .main {{
            border-left-width: 0 !important;
            border-radius: 0 !important;
            border-right-width: 0 !important;
          }}
          table[class=body] .btn table {{
            width: 100% !important;
          }}
          table[class=body] .btn a {{
            width: 100% !important;
          }}
          table[class=body] .img-responsive {{
            height: auto !important;
            max-width: 100% !important;
            width: auto !important;
          }}
        }}
        </style>
      </head>
      <body class="" style="background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
        <table border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f6f6f6; width: 100%;">
          <tr>
            <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
            <td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; margin: 0 auto; max-width: 580px; padding: 10px; width: 580px;">
              <div class="content" style="box-sizing: border-box; display: block; margin: 0 auto; max-width: 580px; padding: 10px;">

                <!-- START CENTERED WHITE CONTAINER -->
                <table class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background: #ffffff; border-radius: 8px; width: 100%; border: 1px solid #e9e9e9; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">

                  <!-- START MAIN CONTENT AREA -->
                  <tr>
                    <td class="wrapper" style="font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 30px;">
                      <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;">
                        <tr>
                          <td style="font-family: sans-serif; font-size: 14px; vertical-align: top; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0; margin-bottom: 20px;">
                            <div style="font-size: 24px; font-weight: 800; color: #4f46e5; text-decoration: none;">
                               <span style="background-color: #4f46e5; width: 16px; height: 16px; border-radius: 4px; display: inline-block; vertical-align: middle;"></span>
                               <span style="vertical-align: middle; margin-left: 4px;">TaleemPro</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="font-family: sans-serif; font-size: 14px; vertical-align: top; padding-top: 15px;">
                            {body_content}
                            <br/>
                            {btn_html}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                <!-- END MAIN CONTENT AREA -->
                </table>

                <!-- START FOOTER -->
                <div class="footer" style="clear: both; margin-top: 10px; text-align: center; width: 100%;">
                  <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;">
                    <tr>
                      <td class="content-block" style="font-family: sans-serif; vertical-align: top; padding-bottom: 10px; padding-top: 10px; font-size: 12px; color: #999999; text-align: center;">
                        <span class="apple-link" style="color: #999999; font-size: 12px; text-align: center;">TaleemPro Education Management System &copy; 2026</span>
                      </td>
                    </tr>
                  </table>
                </div>
                <!-- END FOOTER -->

              <!-- END CENTERED WHITE CONTAINER -->
              </div>
            </td>
            <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;">&nbsp;</td>
          </tr>
        </table>
      </body>
    </html>
    """

def _send_email_worker(email_log_id):
    """
    Background worker that attempts to send a generated email log.
    """
    try:
        email_log = EmailLog.objects.get(id=email_log_id)
    except EmailLog.DoesNotExist:
        logger.error(f"EmailLog ID {email_log_id} not found in background worker.")
        return

    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'TaleemPro <noreply@taleempro.com>')
        text_content = strip_tags(email_log.message)
        
        msg = EmailMultiAlternatives(
            subject=email_log.subject,
            body=text_content,
            from_email=from_email,
            to=[email_log.recipient_email],
            headers={
                'Auto-Submitted': 'auto-generated',
                'X-Auto-Response-Suppress': 'All',
            }
        )
        msg.attach_alternative(email_log.message, "text/html")
        msg.send()

        # Update EmailLog on success
        email_log.status = EmailLog.StatusChoices.SENT
        email_log.sent_at = timezone.now()
        email_log.error_message = None
        email_log.save()
        logger.info(f"Email to {email_log.recipient_email} sent successfully.")
    except Exception as e:
        logger.exception(f"Failed to send email to {email_log.recipient_email}.")
        email_log.status = EmailLog.StatusChoices.FAILED
        email_log.error_message = str(e)
        email_log.save()


def send_email_async(recipient_email, subject, html_message, notification_type=None):
    """
    Saves the email to the logs as PENDING and submits it to the thread pool executor.
    """
    email_log = EmailLog.objects.create(
        recipient_email=recipient_email,
        subject=subject,
        message=html_message,
        status=EmailLog.StatusChoices.PENDING,
        notification_type=notification_type
    )
    transaction.on_commit(lambda: _executor.submit(_send_email_worker, email_log.id))
    return email_log


def resend_failed_email(email_log):
    """
    Resubmits a failed or existing email log for delivery.
    """
    email_log.status = EmailLog.StatusChoices.PENDING
    email_log.error_message = None
    email_log.save()
    transaction.on_commit(lambda: _executor.submit(_send_email_worker, email_log.id))


def log_audit_action(user, action, module, description):
    """
    Creates an audit log record for admin actions.
    """
    AuditLog.objects.create(
        user=user,
        action=action,
        module=module,
        description=description
    )


def create_in_app_notification(user, title, message, type):
    """
    Pushes an in-app notification to the database.
    """
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        type=type
    )


def trigger_welcome_email(teacher_name, teacher_email, temp_password):
    """
    Compiles and triggers the teacher welcome email.
    """
    settings_obj = NotificationSetting.get_settings()
    if not settings_obj.welcome_emails_enabled:
        logger.info(f"Welcome emails are disabled. Skipping welcome email for {teacher_email}.")
        return None

    subject = "Welcome to TaleemPro!"
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    login_url = f"{frontend_url.rstrip('/')}/login"
    
    body = f"""
    <h1 style="color: #1e293b; font-size: 22px; font-weight: 700; margin-top: 0;">Welcome to TaleemPro, {teacher_name}!</h1>
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">Your teacher account has been successfully created by the administrator.</p>
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">You can log in to your account using the credentials below:</p>
    
    <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f8fafc; border-radius: 6px; margin: 20px 0; border: 1px dashed #cbd5e1;">
      <tr>
        <td style="padding: 15px;">
          <strong style="color: #1e293b;">Registered Email:</strong> <code style="color: #4f46e5; font-size: 14px;">{teacher_email}</code><br/>
          <strong style="color: #1e293b;">Temporary Password:</strong> <code style="color: #b91c1c; font-size: 14px;">{temp_password}</code>
        </td>
      </tr>
    </table>
    
    <p style="color: #475569; font-size: 13px;">Please make sure to change your temporary password after logging in for the first time.</p>
    """
    
    html_content = get_base_html_template(
        title=subject,
        body_content=body,
        button_text="Login to Portal",
        button_url=login_url
    )
    
    return send_email_async(
        recipient_email=teacher_email,
        subject=subject,
        html_message=html_content,
        notification_type=Notification.TypeChoices.WELCOME
    )


def trigger_course_assignment_email(teacher, course):
    """
    Compiles and triggers the course assignment notification email.
    """
    settings_obj = NotificationSetting.get_settings()
    if not settings_obj.course_assignment_emails_enabled:
        logger.info(f"Course assignment emails are disabled. Skipping for course {course.course_code}.")
        return None

    subject = f"New Course Assigned: {course.course_code}"
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    login_url = f"{frontend_url.rstrip('/')}/courses"
    
    body = f"""
    <h1 style="color: #1e293b; font-size: 22px; font-weight: 700; margin-top: 0;">New Course Assigned</h1>
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">Hello {teacher.name},</p>
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">You have been assigned as the instructor for the following course:</p>
    
    <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f8fafc; border-radius: 6px; margin: 20px 0; border: 1px solid #cbd5e1;">
      <tr>
        <td style="padding: 15px;">
          <strong style="color: #1e293b;">Course Name:</strong> {course.course_name}<br/>
          <strong style="color: #1e293b;">Course Code:</strong> {course.course_code}<br/>
          <strong style="color: #1e293b;">Department:</strong> {teacher.department}<br/>
          <strong style="color: #1e293b;">Assignment Date:</strong> {timezone.now().strftime('%B %d, %Y')}
        </td>
      </tr>
    </table>
    
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">You can view students, mark attendance, and manage grades for this course directly in your dashboard.</p>
    """
    
    html_content = get_base_html_template(
        title=subject,
        body_content=body,
        button_text="View Course Registry",
        button_url=login_url
    )
    
    return send_email_async(
        recipient_email=teacher.email,
        subject=subject,
        html_message=html_content,
        notification_type=Notification.TypeChoices.COURSE_ASSIGNED
    )
