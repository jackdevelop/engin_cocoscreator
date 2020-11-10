let OPENLOGFLAG = true;

/**
 *  log 自定义
 */
export class LogWrap {
  private static getDateString(): string {
    let d = new Date();
    let str = d.getHours().toString();
    let timeStr = "";
    timeStr += (str.length == 1 ? "0" + str : str) + ":";
    str = d.getMinutes().toString();
    timeStr += (str.length == 1 ? "0" + str : str) + ":";
    str = d.getSeconds().toString();
    timeStr += (str.length == 1 ? "0" + str : str) + ":";
    str = d.getMilliseconds().toString();
    if (str.length == 1) str = "00" + str;
    if (str.length == 2) str = "0" + str;
    timeStr += str;
    timeStr = "[" + timeStr + "]";
    return timeStr;
  }
  private static stack(index): string {
    var e = new Error();
    var lines = e.stack.split("\n");
    lines.shift();
    var result = [];
    lines.forEach(function (line) {
      line = line.substring(7);
      var lineBreak = line.split(" ");
      if (lineBreak.length < 2) {
        result.push(lineBreak[0]);
      } else {
        result.push({ [lineBreak[0]]: lineBreak[1] });
      }
    });
    var list = [];
    if (index < result.length - 1) {
      for (var a in result[index]) {
        list.push(a);
      }
    }
    var splitList = list[0].split(".");
    return splitList[0] + ".js->" + splitList[1] + ": ";
  }
  public static log(...args) {
    var backLog = console.log || cc.log;
  }
  public static info(...args) {
    var backLog = console.log || cc.log;
  }
  public static warn(...args) {
    var backLog = console.log || cc.log;
  }
  public static err(...args) {
    var backLog = console.log || cc.log;
  }
}
