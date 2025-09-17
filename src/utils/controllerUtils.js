// Standard success envelope (uniform API) / מעטפת הצלחה אחידה
export function ok(res, data = {}, meta = {}, status = 200) {
    res.status(status).json({success: true, data, meta: { timestamp: Date.now(), requestId: res.locals?.requestId, ...meta}});
  }
  
  // Standard error envelope + proper status code / מעטפת שגיאה אחידה עם קוד סטטוס מתאים
  export function fail(res, statusCode, message, extra = {}, meta = {}) {
    res.status(statusCode).json({success: false, error: { message, ...extra }, meta: { timestamp: Date.now(), requestId: res.locals?.requestId, ...meta}});
  }
  
  // Async wrapper for consistent error handling / עטיפת async לטיפול עקבי בשגיאות
  export const wrap = (fn) => (req, res) =>
    Promise.resolve(fn(req, res)).catch((err) =>
      fail(res, 500, err?.message || "Internal server error")
    );
  