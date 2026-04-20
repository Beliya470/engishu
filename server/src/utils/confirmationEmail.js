const { sendEmail } = require('./email');

/* ─── Shared layout wrappers ──────────────────────────────────────────────── */

function emailWrapper(bodyHtml) {
  return `
    <div style="font-family:'Inter',Arial,sans-serif;max-width:580px;margin:0 auto;color:#1A1A1A;background:#F3F4F6;padding:24px 0;">
      <!-- Header -->
      <div style="background:#3D1A00;padding:24px 32px;border-radius:12px 12px 0 0;">
        <p style="margin:0;font-size:11px;color:#1DB8A8;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Engishu Insurance Agency</p>
        <h1 style="color:#ffffff;font-size:22px;margin:6px 0 0;font-weight:800;">Your Cover. Our Commitment.</h1>
      </div>
      <!-- Body -->
      <div style="background:#ffffff;padding:36px 32px;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;">
        ${bodyHtml}
        <!-- Footer -->
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:32px 0 20px;">
        <p style="font-size:11px;color:#9CA3AF;margin:0;line-height:1.8;">
          <strong style="color:#633806;">Engishu Insurance Agency</strong><br>
          1st Floor, CPA Center (Block A), Thika Road, Nairobi<br>
          <a href="tel:+254759840614" style="color:#1DB8A8;text-decoration:none;">+254 759 840 614</a>
          &nbsp;·&nbsp;
          <a href="https://wa.me/254759840614" style="color:#1DB8A8;text-decoration:none;">WhatsApp</a>
          &nbsp;·&nbsp;
          <a href="mailto:cover@engishu.com" style="color:#1DB8A8;text-decoration:none;">cover@engishu.com</a><br>
          Licensed by the Insurance Regulatory Authority of Kenya (IRA)
        </p>
      </div>
    </div>
  `;
}

function refBlock(refNumber, extra) {
  return `
    <div style="background:#F7FFFE;border:1px solid #D1FAF5;border-left:4px solid #1DB8A8;border-radius:8px;padding:16px 20px;margin:24px 0;">
      <p style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Your Reference Number</p>
      <p style="font-size:26px;font-weight:800;color:#633806;margin:0;">${refNumber}</p>
      ${extra ? `<p style="font-size:12px;color:#6B7280;margin:6px 0 0;">${extra}</p>` : ''}
    </div>
  `;
}

function nextStepsList(items) {
  const rows = items.map((item, i) => `
    <tr>
      <td style="vertical-align:top;padding:0 12px 14px 0;width:28px;">
        <div style="width:24px;height:24px;background:#1DB8A8;border-radius:50%;text-align:center;line-height:24px;font-size:11px;font-weight:800;color:#fff;">${i + 1}</div>
      </td>
      <td style="vertical-align:top;padding:0 0 14px;font-size:14px;color:#374151;line-height:1.6;">${item}</td>
    </tr>
  `).join('');
  return `<table style="border-collapse:collapse;width:100%;">${rows}</table>`;
}

function urgentBox() {
  return `
    <div style="background:#FEF9F0;border:1px solid #F59E0B;border-radius:8px;padding:14px 18px;margin:24px 0;">
      <p style="font-size:13px;color:#92400E;margin:0;">
        <strong>Need urgent assistance?</strong> Call us at
        <a href="tel:+254759840614" style="color:#633806;font-weight:700;text-decoration:none;">+254 759 840 614</a>
        or <a href="https://wa.me/254759840614" style="color:#1DB8A8;text-decoration:none;">send us a WhatsApp</a>.
        We're available Monday – Friday, 8am – 6pm.
      </p>
    </div>
  `;
}


/* ─── Template 1: ICPAK Motor Insurance Quote ────────────────────────────── */

function motorInsuranceTemplate({ refNumber, name }) {
  const body = `
    <p style="font-size:16px;margin:0 0 6px;">Hello <strong>${name}</strong>,</p>
    <p style="font-size:14px;color:#6B7280;line-height:1.7;margin:0 0 20px;">
      Thank you for completing your <strong style="color:#633806;">ICPAK Private Motor Insurance</strong> quote with Engishu Insurance.
      We have received your vehicle details and indicative premium, and our team is now reviewing your request.
    </p>

    ${refBlock(refNumber, 'Keep this reference number handy — you will need it when making your M-Pesa payment.')}

    <p style="font-size:14px;font-weight:700;color:#633806;margin:0 0 14px;">What happens next</p>
    ${nextStepsList([
      '<strong>Pay at least 30% of your annual premium</strong> via Lipa na M-Pesa Pay Bill. Business Number: <strong>898200</strong>. Account Number: <strong>your vehicle registration number</strong>.',
      'Click <strong>Submit Car Details</strong> in the form on our website to send us your vehicle information.',
      'Submit your documentation (National ID, Car Logbook, KRA PIN, and your M-Pesa payment code) via the Upload Documents section on our website or by WhatsApp.',
      'We will issue a <strong>1-month Certificate of Insurance</strong> and a <strong>Valuation Letter</strong> to this email address. Your final annual premium will be confirmed after valuation.',
    ])}

    ${urgentBox()}

    <p style="font-size:12px;color:#9CA3AF;margin:24px 0 0;line-height:1.6;">
      Engishu Insurance takes your data privacy seriously. Any information you provide is used solely to facilitate your insurance contract.
    </p>
  `;
  return {
    subject: `Your Motor Insurance Quote — Ref #${refNumber}`,
    html: emailWrapper(body),
  };
}


/* ─── Template 2: General Product Quote ──────────────────────────────────── */

function generalQuoteTemplate({ refNumber, name, product }) {
  const productDisplay = product || 'your selected insurance product';
  const body = `
    <p style="font-size:16px;margin:0 0 6px;">Hello <strong>${name}</strong>,</p>
    <p style="font-size:14px;color:#6B7280;line-height:1.7;margin:0 0 20px;">
      Thank you for requesting a quote for <strong style="color:#633806;">${productDisplay}</strong>.
      We have received your details and our team is on it — we typically respond within <strong>2 hours</strong> during business hours.
    </p>

    ${refBlock(refNumber, `Product: ${productDisplay}`)}

    <p style="font-size:14px;font-weight:700;color:#633806;margin:0 0 14px;">What happens next</p>
    ${nextStepsList([
      'Our team reviews your request and confirms your coverage requirements.',
      'We compare options from our network of partner underwriters to find you the best fit.',
      'We contact you by phone or WhatsApp with tailored options and competitive pricing.',
      'Once you are happy, we handle all the paperwork and get your cover in place quickly.',
    ])}

    ${urgentBox()}
  `;
  return {
    subject: `Your ${productDisplay} Quote — Ref #${refNumber}`,
    html: emailWrapper(body),
  };
}


/* ─── Template 3: Contact / General Enquiry ──────────────────────────────── */

function enquiryTemplate({ refNumber, name }) {
  const body = `
    <p style="font-size:16px;margin:0 0 6px;">Hello <strong>${name}</strong>,</p>
    <p style="font-size:14px;color:#6B7280;line-height:1.7;margin:0 0 20px;">
      Thank you for getting in touch with Engishu Insurance. We have received your message and a member of our team
      will get back to you within <strong>24 hours</strong>.
    </p>

    ${refBlock(refNumber)}

    <p style="font-size:14px;font-weight:700;color:#633806;margin:0 0 14px;">What happens next</p>
    ${nextStepsList([
      'A member of our team reads your message carefully.',
      'We prepare a personalised response to address your specific question or need.',
      'We contact you by email or phone — whichever you prefer.',
    ])}

    ${urgentBox()}
  `;
  return {
    subject: `We've Received Your Message — Ref #${refNumber}`,
    html: emailWrapper(body),
  };
}


/* ─── Template 4: Motor Document Upload ──────────────────────────────────── */

function documentUploadTemplate({ refNumber, name }) {
  const body = `
    <p style="font-size:16px;margin:0 0 6px;">Hello <strong>${name}</strong>,</p>
    <p style="font-size:14px;color:#6B7280;line-height:1.7;margin:0 0 20px;">
      Thank you for submitting your cover documentation to Engishu Insurance.
      We have received your files and our team will review them promptly.
    </p>

    ${refBlock(refNumber, 'Please quote this reference in any follow-up communication.')}

    <p style="font-size:14px;font-weight:700;color:#633806;margin:0 0 14px;">What happens next</p>
    ${nextStepsList([
      'Our underwriting team reviews your submitted documents (ID, Logbook, KRA PIN, and M-Pesa payment confirmation).',
      'We issue a <strong>1-month Certificate of Insurance</strong> and a <strong>Valuation Letter</strong> to this email address.',
      'After your vehicle valuation is completed, we confirm your final annual premium and issue your full annual cover.',
    ])}

    <div style="background:#F7FFFE;border:1px solid #D1FAF5;border-radius:8px;padding:14px 18px;margin:24px 0;">
      <p style="font-size:13px;color:#374151;margin:0;line-height:1.6;">
        <strong style="color:#1DB8A8;">Missing a document?</strong>
        You can submit any outstanding documents via WhatsApp to
        <a href="https://wa.me/254759840614" style="color:#1DB8A8;text-decoration:none;">+254 759 840 614</a>
        quoting your reference number <strong>${refNumber}</strong>.
      </p>
    </div>

    ${urgentBox()}
  `;
  return {
    subject: `Cover Documentation Received — Ref #${refNumber}`,
    html: emailWrapper(body),
  };
}


/* ─── Main dispatcher ─────────────────────────────────────────────────────── */

async function sendConfirmationEmail(to, { refNumber, name, type, product }) {
  if (!to) return;

  const firstName = (name || 'there').split(' ')[0];
  let template;

  if (type === 'Document Upload') {
    template = documentUploadTemplate({ refNumber, name: firstName });
  } else if (type === 'Enquiry') {
    template = enquiryTemplate({ refNumber, name: firstName });
  } else if (product && product.toLowerCase().includes('motor insurance')) {
    template = motorInsuranceTemplate({ refNumber, name: firstName });
  } else {
    template = generalQuoteTemplate({ refNumber, name: firstName, product });
  }

  await sendEmail(to, template.subject, template.html);
}

module.exports = { sendConfirmationEmail };
