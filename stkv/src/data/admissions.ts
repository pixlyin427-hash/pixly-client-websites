/**
 * Admissions content. The process & checklist are a TYPICAL structure for CBSE schools, shown
 * for the demo; the school's actual admission rules (published on the legacy site) must be
 * migrated here verbatim before launch. Do not add age cut-offs or fees without the school.
 */
export const steps = [
  { n: '01', title: 'Make an enquiry', text: 'Share your child’s details and the class you are applying for — online or at the school office.' },
  { n: '02', title: 'Visit the campus', text: 'Meet the admissions team, see the school and ask your questions.' },
  { n: '03', title: 'Submit the form & documents', text: 'Complete the admission form and submit the documents listed by the school.' },
  { n: '04', title: 'Confirmation', text: 'The school confirms the admission once verification and formalities are complete.' },
];

export const documentChecklist = [
  { id: 'birth', label: 'Birth certificate of the student', hint: 'Usually required for age verification.' },
  { id: 'aadhaar', label: 'Aadhaar card of the student', hint: 'If available.' },
  { id: 'photos', label: 'Recent passport-size photographs', hint: 'Student and parents — number to be confirmed.' },
  { id: 'reportcard', label: 'Previous school report card', hint: 'For admission to Class 2 and above.' },
  { id: 'lc', label: 'School Leaving / Transfer Certificate', hint: 'For students moving from another school.' },
  { id: 'address', label: 'Proof of residence', hint: 'Any document accepted by the school.' },
  { id: 'parentid', label: 'Parents’ identity proof', hint: 'Aadhaar, PAN or passport.' },
  { id: 'category', label: 'Category certificate', hint: 'Only if applicable.' },
];

export const faqs = [
  { q: 'Which classes does STKV offer?', a: 'STKV is affiliated to CBSE at the Secondary level (up to Class X). This website covers Classes 1 to 10. Information about pre-primary classes will be confirmed by the school.' },
  { q: 'What is the age criterion for admission?', a: 'Age criteria are set in the school’s admission rules. They will be published here from the school’s official rules — please confirm with the school office until then.' },
  { q: 'When do admissions open?', a: 'Admission dates are announced through the Notice Centre and the school office. Make an enquiry and the school can contact you when admissions open.' },
  { q: 'Where can I find the fee structure?', a: 'CBSE requires schools to publish their fee structure under Mandatory Public Disclosure. It will be available in the Transparency Centre once the school uploads it.' },
  { q: 'Does the school provide transport?', a: 'Transport details have not yet been confirmed by the school. Use the transport enquiry on the Contact page and the school office can advise you.' },
  { q: 'Is this enquiry form connected to the school?', a: 'Not yet. This website is a design demonstration — forms validate and show a confirmation, but nothing is sent to the school. For a real enquiry, contact the school office directly.' },
];

export const enquiryClasses = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
