
  /**
   * 详细文档需要参考 ：
   * 1. 请求结构：https://cloud.tencent.com/document/product/1007/31322
   * 2. 公共参数：https://cloud.tencent.com/document/product/1007/31323
   * 3. 接口鉴权v3：https://cloud.tencent.com/document/product/1007/31324
   * 4. 通用印刷体文字识别文档：https://cloud.tencent.com/document/api/866/33526
   */

  const crypto = require('crypto')
  var request = require("request")
  
  // 1. 拼接规范请求串 CanonicalRequest
  var HTTPRequestMethod = 'POST'; // HTTP 请求方法（GET、POST ）。此示例取值为 POST
  var CanonicalURI = '/'; // URI 参数，API 3.0 固定为正斜杠（/）
  var CanonicalQueryString = ""; // POST请求时为空
  var CanonicalHeaders = "content-type:application/json\nhost:ocr.tencentcloudapi.com\n";
  /**
   * 参与签名的头部信息，content-type 和 host 为必选头部，
   * 其中 host 指接口请求域名 POST 请求支持的 Content-Type 类型有：
   * 1. application/json（推荐），必须使用 TC3-HMAC-SHA256 签名方法。； 
   * 2. application/x-www-form-urlencoded，必须使用 HmacSHA1 或 HmacSHA256 签名方法。； 
   * 3. multipart/form-data（仅部分接口支持），必须使用 TC3-HMAC-SHA256 签名方法。
   */
  var SignedHeaders = "content-type;host";
  /**
   * 参与签名的头部信息的 key，可以说明此次请求都有哪些头部参与了签名，和 CanonicalHeaders 包含的头部内容是一一对应的。
   * content-type 和 host 为必选头部 。 
   * 注意： 
   * 1. 头部 key 统一转成小写； 
   * 2. 多个头部 key（小写）按照 ASCII 升序进行拼接，并且以分号（;）分隔 。 
   */
  // 传入需要做 HTTP 请求的正文 body
  var payload = {
      "ImageUrl":"https://imgcache.qq.com/open_proj/proj_qcloud_v2/gateway/product/ocr-demo/css/img/GeneralBasicOCR1.jpg"
  } 
  var HashedRequestPayload = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex'); // 哈希加密后的请求字符串 此示例结果是e4b76b87ed3234a73c7ff4665a4e9d566b7f9c959bc616a0b6aec403789a5924
  console.log(HashedRequestPayload)
  // 拼接
  var CanonicalRequest =  HTTPRequestMethod + '\n' +
    CanonicalURI + '\n' +
    CanonicalQueryString + '\n' +
    CanonicalHeaders + '\n' +
    SignedHeaders + '\n' +
    HashedRequestPayload;
  console.log('1. 拼接规范请求串' + CanonicalRequest);
  console.log('\n');

  // 2. 拼接待签名字符串
  var Algorithm = "TC3-HMAC-SHA256"; // 签名算法，目前固定为 TC3-HMAC-SHA256
  var RequestTimestamp = Math.round(new Date().getTime()/1000) + ""; // 请求时间戳，即请求头部的公共参数 X-TC-Timestamp 取值，取当前时间 UNIX 时间戳，精确到秒
  var t = new Date();
  var date = t.toISOString().substr(0, 10); // 计算 Date 日期   date = "2019-08-26"
  /**
   * Date 必须从时间戳 X-TC-Timestamp 计算得到，且时区为 UTC+0。
   * 如果加入系统本地时区信息，例如东八区，将导致白天和晚上调用成功，但是凌晨时调用必定失败。
   * 假设时间戳为 1551113065，在东八区的时间是 2019-02-26 00:44:25，但是计算得到的 Date 取 UTC+0 的日期应为 2019-02-25，而不是 2019-02-26。
   * Timestamp 必须是当前系统时间，且需确保系统时间和标准时间是同步的，如果相差超过五分钟则必定失败。
   * 如果长时间不和标准时间同步，可能导致运行一段时间后，请求必定失败，返回签名过期错误。
   */
  var CredentialScope = date + "/ocr/tc3_request"; 
  /**
   *  拼接 CredentialScope 凭证范围，格式为 Date/service/tc3_request ， 
   * service 为服务名，慧眼用 faceid ， OCR 文字识别用 ocr
   */

   // 将第一步拼接得到的 CanonicalRequest 再次进行哈希加密
  var HashedCanonicalRequest = crypto.createHash('sha256').update(CanonicalRequest).digest('hex'); 
  // 拼接
  var StringToSign = Algorithm + '\n' +
    RequestTimestamp + '\n' +
    CredentialScope + '\n' +
    HashedCanonicalRequest;
  console.log('2. 拼接待签名字符串' + StringToSign);
  console.log('\n');

  // 3. 计算签名
  var SecretKey = ""; // SecretKey, 需要替换为自己的
  var SecretDate = crypto.createHmac('sha256', "TC3"+SecretKey).update(date).digest();
  var SecretService = crypto.createHmac('sha256', SecretDate).update("ocr").digest();
  var SecretSigning = crypto.createHmac('sha256', SecretService).update("tc3_request").digest();
  var Signature = crypto.createHmac('sha256', SecretSigning).update(StringToSign).digest('hex');
  console.log('3. 计算签名' + Signature); // 当前计算为 23760169fd18522e0f4f317d4c3f2cf875de7038cc27f1ea5648e88bb5ebb1d9

  // 4. 拼接Authorization
  var SecretId = ""; // // SecretId, 需要替换为自己的
  var Algorithm = "TC3-HMAC-SHA256";
  var Authorization =
    Algorithm + ' ' +
    'Credential=' + SecretId + '/' + CredentialScope + ', ' +
    'SignedHeaders=' + SignedHeaders + ', ' +
    'Signature=' + Signature
  console.log('4. 拼接Authorization' + Authorization)
  // TC3-HMAC-SHA256 Credential=AKIDnPFrGQC2TgdU6UqU9ZlidJlzyiDUxR7Y/2019-08-26/ocr/tc3_request, SignedHeaders=content-type;host, Signature=23760169fd18522e0f4f317d4c3f2cf875de7038cc27f1ea5648e88bb5ebb1d9

  // 5.发送POST请求
  console.log(RequestTimestamp)
  // https模块 request options配置
  var options = {
      url: 'https://ocr.tencentcloudapi.com/',
      method:'POST',
      json: true,
      headers: {
        "Content-Type": "application/json",
        "Authorization": Authorization,
        "Host": "ocr.tencentcloudapi.com",
        "X-TC-Action": "IDCardOCR",
        "X-TC-Version": "2018-11-19",
        "X-TC-Timestamp": RequestTimestamp,
        "X-TC-Region": "ap-guangzhou"
      },
      body: payload,
  };
  // 发起请求
  request(options, function (error, response, body) {
    if (error) throw new Error(error); 
    console.log(JSON.stringify(body))
  });
