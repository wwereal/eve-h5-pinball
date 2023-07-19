function fillZero(num: number) {
    return num < 10 ? `0${num}` : num.toString();
}
/**
 *
 * @param timestamp 时间戳
 * @param format 格式化字符串，yyyy 是年份，MM 是长月份，M 是短月份，dd 是长日期，d 是短日期，HH 是小时，mm 是分，ss 是秒
 * @param timezone 时区，默认为 8 （GTM+8）
 * @returns 格式化后的字符串
 */
export function transformMsToString(timestamp: number, format = 'yyyy-MM-dd HH:mm:ss', timezone = 8) {
    let date = new Date(timestamp);
    const offsetZone = date.getTimezoneOffset() / 60;
    const offset = offsetZone + timezone;
    const adjustmentTimestamp = timestamp + offset * 60 * 60 * 1000;
    date = new Date(adjustmentTimestamp);
    const year = date.getFullYear();
    const shortMonth = date.getMonth() + 1;
    const month = fillZero(shortMonth);
    const shortDay = date.getDate();
    const day = fillZero(shortDay);
    const hours = fillZero(date.getHours());
    const minutes = fillZero(date.getMinutes());
    const second = fillZero(date.getSeconds());

    return format
        .replace('yyyy', year.toString())
        .replace('MM', month)
        .replace('M', shortMonth.toString())
        .replace('dd', day)
        .replace('d', shortDay.toString())
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', second);
}
