export function getIP(request: any): string {
  let ip: string;
  const ipAddr = request.headers['x-forwarded-for'];
  if (ipAddr) {
    const list = ipAddr.split(',');
    ip = list[list.length - 1];
  } else {
    ip = request.connection.remoteAddress;
  }
  return ip.replace('::ffff:', '');
}
