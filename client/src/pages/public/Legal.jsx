const CONTENT = {
  terms: {
    title: 'Terms of Service',
    sections: [
      [
        'Purpose of CiviCare',
        'CiviCare is the official web-based citizen engagement and community resilience platform of Barangay Magdiwang, Noveleta, Cavite. It lets residents report community incidents, request barangay documents, receive announcements and emergency alerts, and join community programs.',
      ],
      [
        'Eligibility and accounts',
        'Accounts are for residents of Barangay Magdiwang. You must give true and correct information. Your request may be checked against the Records of Barangay Inhabitants (RBI). You are responsible for keeping your password secret and for all activity under your account.',
      ],
      [
        'Responsible reporting',
        'Use Incident Reporting only for genuine non-political community concerns such as floods, fires, medical emergencies, road accidents, interpersonal disputes, and criminal incidents. Prank, false, or malicious reports may lead to account suspension and may be referred to the proper authorities. For life-threatening emergencies, also call 911.',
      ],
      [
        'Documents',
        'Documents issued through CiviCare carry a QR code with a security code. Altering an issued document or its QR code is prohibited; altered copies will fail verification. Fees, where applicable, are paid upon release at the Barangay Hall.',
      ],
      [
        'SMS notifications',
        'By registering a mobile number you agree to receive SMS confirmations, status updates, announcements, and emergency alerts from the barangay. SMS delivery depends on your network and the SMS gateway and is not guaranteed.',
      ],
      [
        'Availability',
        'The barangay aims to keep CiviCare available at all times but does not guarantee uninterrupted service. CiviCare requires an internet connection and does not replace official emergency services.',
      ],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      [
        'Our commitment',
        'Barangay Magdiwang processes your personal data in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173) and its implementing rules.',
      ],
      [
        'Data we collect',
        'Name, email address, mobile number, purok and address; details you provide in service requests (such as age and civil status); incident reports including GPS location and optional photos; and system logs such as login times and IP address for security auditing.',
      ],
      [
        'How we use it',
        'To verify your residency, process your requests, respond to reported incidents, send SMS and in-app notifications, keep emergency contact lists, and produce statistical reports for the municipal LGU. We do not sell your data.',
      ],
      [
        'Who can see it',
        'Only authorized barangay officials and system administrators, according to their role. Residents can only see their own reports and requests. Our SMS provider (Semaphore) receives your mobile number only to deliver messages.',
      ],
      [
        'Retention and security',
        'Records are kept only as long as needed for barangay operations and legal requirements, then archived or deleted. Passwords are stored hashed, connections are encrypted, and all administrative actions are recorded in an audit log.',
      ],
      [
        'Your rights',
        'You may ask to access, correct, or delete your personal data, or withdraw consent, by contacting the Barangay Hall or barangaymagdiwang@gmail.com.',
      ],
    ],
  },
};

const Legal = ({ type }) => {
  const { title, sections } = CONTENT[type];
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">CiviCare — Barangay Magdiwang, Noveleta, Cavite</p>
      <div className="mt-8 space-y-6">
        {sections.map(([heading, body]) => (
          <section key={heading}>
            <h2 className="font-display text-lg font-bold">{heading}</h2>
            <p className="mt-1 leading-relaxed text-gray-600 dark:text-gray-300">{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
};

export default Legal;
