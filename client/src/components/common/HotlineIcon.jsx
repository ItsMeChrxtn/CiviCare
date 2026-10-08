import { FiPhoneCall } from 'react-icons/fi';
import { MdLocalFireDepartment, MdLocalPolice, MdLocalHospital, MdAccountBalance, MdHealthAndSafety, MdWarning } from 'react-icons/md';

const ICONS = {
  barangay: MdAccountBalance,
  fire: MdLocalFireDepartment,
  police: MdLocalPolice,
  medical: MdLocalHospital,
  hospital: MdLocalHospital,
  mdrrmo: MdWarning,
  other: MdHealthAndSafety,
};

const HotlineIcon = ({ category, className = 'h-6 w-6' }) => {
  const Icon = ICONS[category] || FiPhoneCall;
  return <Icon className={className} aria-hidden="true" />;
};

export default HotlineIcon;
