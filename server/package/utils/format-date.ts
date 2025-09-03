export function formateToAmPm(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const amOrPm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // If hour is 0, set it to 12 (for 12 AM/PM)

  return `${year}-${month}-${day} ${hours}:${minutes} ${amOrPm}`;
}
