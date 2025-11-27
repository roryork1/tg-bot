const TOKEN = ENV_BOT_TOKEN // Get it from @BotFather
const WEBHOOK = '/endpoint'
const SECRET = ENV_BOT_SECRET // A-Z, a-z, 0-9, _ and -
const ADMIN_UID = ENV_ADMIN_UID // your user id, get it from https://t.me/username_to_id_bot

const NOTIFY_INTERVAL = 3600 * 1000;
const fraudDb = 'https://raw.githubusercontent.com/LloydAsp/nfd/main/data/fraud.db';
const notificationUrl = 'https://raw.githubusercontent.com/LloydAsp/nfd/main/data/notification.txt'
const startMsgUrl = 'https://raw.githubusercontent.com/LloydAsp/nfd/main/data/startMessage.md';

const enable_notification = false
// 从KV存储获取验证功能开关状态，如果未设置则默认为true
let enable_verification = true // 是否启用验证码

/**
 * Return url to telegram api, optionally with parameters added
 */
function apiUrl (methodName, params = null) {
  let query = ''
  if (params) {
    query = '?' + new URLSearchParams(params).toString()
  }
  return `https://api.telegram.org/bot${TOKEN}/${methodName}${query}`
}

function requestTelegram(methodName, body, params = null){
  return fetch(apiUrl(methodName, params), body)
    .then(r => r.json())
}

function makeReqBody(body){
  return {
    method:'POST',
    headers:{
      'content-type':'application/json'
    },
    body:JSON.stringify(body)
  }
}

function sendMessage(msg = {}){
  return requestTelegram('sendMessage', makeReqBody(msg))
}

function copyMessage(msg = {}){
  return requestTelegram('copyMessage', makeReqBody(msg))
}

function forwardMessage(msg){
  return requestTelegram('forwardMessage', makeReqBody(msg))
}

function sendPhoto(msg = {}){
  return requestTelegram('sendPhoto', makeReqBody(msg))
}

/**
 * 生成数学验证码
 */
function generateMathCaptcha(){
  const a = Math.floor(Math.random() * 50) + 10
  const b = Math.floor(Math.random() * 50) + 10
  const operators = ['+', '-', '*']
  const op = operators[Math.floor(Math.random() * operators.length)]
  
  let answer
  let question
  
  if(op === '+'){
    answer = a + b
    question = `${a} + ${b} = ?`
  } else if(op === '-'){
    answer = a - b
    question = `${a} - ${b} = ?`
  } else {
    const a2 = Math.floor(Math.random() * 12) + 2
    const b2 = Math.floor(Math.random() * 12) + 2
    answer = a2 * b2
    question = `${a2} × ${b2} = ?`
  }
  
  return {
    type: 'math',
    question: question,
    answer: String(answer)
  }
}

/**
 * 生成逻辑验证码
 */
function generateLogicCaptcha(){
  const puzzles = [
    () => {
      const age = Math.floor(Math.random() * 8) + 8
      return {
        question: `小明今年${age}岁，5年后他多少岁？`,
        answer: String(age + 5)
      }
    },
    () => {
      const hours = Math.floor(Math.random() * 4) + 2
      return {
        question: `现在是10点，${hours}小时后几点？`,
        answer: String(10 + hours)
      }
    },
    () => {
      const total = Math.floor(Math.random() * 8) + 8
      const eat = Math.floor(Math.random() * 3) + 2
      return {
        question: `有${total}个苹果，吃${eat}个，剩几个？`,
        answer: String(total - eat)
      }
    }
  ]
  
  const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)]()
  return {
    type: 'logic',
    question: puzzle.question,
    answer: puzzle.answer
  }
}

/**
 * 生成中文数字验证码
 */
function generateChineseCaptcha(){
  const chineseNums = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
  const num = Math.floor(Math.random() * 90) + 10 // 10-99
  
  let chineseForm
  if(num >= 10 && num < 20){
    chineseForm = '十' + (num % 10 === 0 ? '' : chineseNums[num % 10])
  } else {
    chineseForm = chineseNums[Math.floor(num / 10)] + '十' + (num % 10 === 0 ? '' : chineseNums[num % 10])
  }
  
  return {
    type: 'chinese',
    question: '请将中文数字转为阿拉伯数字',
    display: chineseForm,
    answer: String(num)
  }
}

/**
 * 生成数字序列验证码（找规律）
 */
function generateSequenceCaptcha(){
  const patterns = [
    // 等差数列
    () => {
      const start = Math.floor(Math.random() * 10) + 1
      const diff = Math.floor(Math.random() * 4) + 2
      const seq = [start, start + diff, start + diff*2, start + diff*3]
      return {
        question: `找规律填空：${seq.join(', ')}, ?`,
        answer: String(start + diff*4)
      }
    },
    // 等比数列
    () => {
      const start = Math.floor(Math.random() * 4) + 2
      const ratio = Math.floor(Math.random() * 2) + 2
      const seq = [start, start*ratio, start*ratio*ratio, start*ratio*ratio*ratio]
      return {
        question: `找规律填空：${seq.join(', ')}, ?`,
        answer: String(start * Math.pow(ratio, 4))
      }
    },
    // 平方数列
    () => {
      const start = Math.floor(Math.random() * 5) + 1
      const seq = [
        Math.pow(start, 2),
        Math.pow(start + 1, 2),
        Math.pow(start + 2, 2),
        Math.pow(start + 3, 2)
      ]
      return {
        question: `找规律填空：${seq.join(', ')}, ?`,
        answer: String(Math.pow(start + 4, 2))
      }
    }
  ]
  
  const pattern = patterns[Math.floor(Math.random() * patterns.length)]()
  return {
    type: 'sequence',
    question: pattern.question,
    answer: pattern.answer
  }
}

/**
 * 生成时间识别验证码
 */
function generateTimeCaptcha(){
  const periods = ['上午', '下午', '晚上']
  const period = periods[Math.floor(Math.random() * periods.length)]
  
  let hour24, hour12
  const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)]
  
  if(period === '上午'){
    hour12 = Math.floor(Math.random() * 6) + 6 // 6-11
    hour24 = hour12
  } else if(period === '下午'){
    hour12 = Math.floor(Math.random() * 6) + 12 // 12, 1-5
    if(hour12 > 12) hour12 -= 12
    hour24 = hour12 === 12 ? 12 : hour12 + 12
  } else { // 晚上
    hour12 = Math.floor(Math.random() * 6) + 6 // 6-11
    hour24 = hour12 + 12
  }
  
  const hourCnMap = {
    1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六',
    7: '七', 8: '八', 9: '九', 10: '十', 11: '十一', 12: '十二'
  }
  
  let timeStr = period + hourCnMap[hour12] + '点'
  if(minute === 15) timeStr += '一刻'
  else if(minute === 30) timeStr += '半'
  else if(minute === 45) timeStr += '三刻'
  
  return {
    type: 'time',
    question: '请用24小时制表示（格式：HH:MM）',
    display: timeStr,
    answer: `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }
}

/**
 * 生成按钮选择验证码
 */
function generateButtonCaptcha(){
  const a = Math.floor(Math.random() * 20) + 5
  const b = Math.floor(Math.random() * 20) + 5
  const operators = ['+', '-']
  const op = operators[Math.floor(Math.random() * operators.length)]
  
  let correctAnswer
  if(op === '+'){
    correctAnswer = a + b
  } else {
    correctAnswer = a - b
  }
  
  // 生成3个错误选项
  const options = [correctAnswer]
  while(options.length < 4){
    const wrongAnswer = correctAnswer + Math.floor(Math.random() * 10) - 5
    if(wrongAnswer !== correctAnswer && wrongAnswer > 0 && !options.includes(wrongAnswer)){
      options.push(wrongAnswer)
    }
  }
  
  // 打乱选项顺序
  options.sort(() => Math.random() - 0.5)
  
  return {
    type: 'button',
    question: `${a} ${op} ${b} = ?`,
    answer: String(correctAnswer),
    options: options
  }
}

/**
 * 生成验证码（随机类型）
 */
function generateCaptcha(){
  const types = ['math', 'logic', 'chinese', 'sequence', 'time', 'button']
  const type = types[Math.floor(Math.random() * types.length)]
  
  switch(type){
    case 'math': return generateMathCaptcha()
    case 'logic': return generateLogicCaptcha()
    case 'chinese': return generateChineseCaptcha()
    case 'sequence': return generateSequenceCaptcha()
    case 'time': return generateTimeCaptcha()
    case 'button': return generateButtonCaptcha()
    default: return generateMathCaptcha()
  }
}

/**
 * Wait for requests to the worker
 */
addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (url.pathname === WEBHOOK) {
    event.respondWith(handleWebhook(event))
  } else if (url.pathname === '/registerWebhook') {
    event.respondWith(registerWebhook(event, url, WEBHOOK, SECRET))
  } else if (url.pathname === '/unRegisterWebhook') {
    event.respondWith(unRegisterWebhook(event))
  } else {
    event.respondWith(new Response('No handler for this request'))
  }
})

/**
 * Handle requests to WEBHOOK
 * https://core.telegram.org/bots/api#update
 */
async function handleWebhook (event) {
  // Check secret
  if (event.request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== SECRET) {
    return new Response('Unauthorized', { status: 403 })
  }

  // Read request body synchronously
  const update = await event.request.json()
  // Deal with response asynchronously
  event.waitUntil(onUpdate(update))

  return new Response('Ok')
}

/**
 * Handle incoming Update
 * https://core.telegram.org/bots/api#update
 */
async function onUpdate (update) {
  if ('message' in update) {
    await onMessage(update.message)
  }
  if ('callback_query' in update) {
    await onCallbackQuery(update.callback_query)
  }
}

/**
 * Handle incoming Message
 * https://core.telegram.org/bots/api#message
 */
async function onMessage (message) {
  // 从KV存储获取验证功能开关状态
  try {
    const verificationStatus = await nfd.get('enable_verification', { type: "json" })
    if(verificationStatus !== null) {
      enable_verification = verificationStatus
    }
  } catch (e) {
    // 如果获取失败，使用默认值true
    console.log('Failed to get enable_verification from KV:', e)
  }
  
  // 管理员消息处理
  if(message.chat.id.toString() === ADMIN_UID){
    // /start 命令
    if(message.text === '/start'){
      return sendMessage({
        chat_id:ADMIN_UID,
        text:'欢迎使用客服Bot管理面板\n\n' +
             '使用方法：\n' +
             '• 回复转发的消息，即可回复用户\n' +
             '• /block - 拉黑用户（回复消息）\n' +
             '• /unblock - 解除拉黑（回复消息）\n' +
             '• /checkblock - 查看黑名单\n' +
             '• /uv - 取消用户验证（回复消息）\n' +
             '• /uv <用户ID> - 取消指定用户验证\n' +
             '• /verificationStatus - 查看验证功能状态\n' +
             '• /enableVerification - 开启答题验证码功能（默认开启））\n' +
             '• /disableVerification - 关闭答题验证码功能'
      })
    }
    
    // 命令处理
    if(message.text && /^\/block$/.test(message.text)){
      return handleBlock(message)
    }
    if(message.text && /^\/unblock$/.test(message.text)){
      return handleUnBlock(message)
    }
    if(message.text && /^\/checkblock$/.test(message.text)){
      return checkBlock(message)
    }
    if(message.text && /^\/uv/.test(message.text)){
      return handleUnverify(message)
    }
    
    // /verificationStatus 命令 - 查看验证功能状态
    if(message.text && message.text === '/verificationStatus'){
      return handleVerificationStatus(message)
    }
    
    // /enableVerification 命令 - 开启验证功能
    if(message.text && message.text === '/enableVerification'){
      return handleEnableVerification(message)
    }
    
    // /disableVerification 命令 - 关闭验证功能
    if(message.text && message.text === '/disableVerification'){
      return handleDisableVerification(message)
    }
    
    // 回复用户消息
    if(message.reply_to_message && message.reply_to_message.message_id){
      let guestChatId = await nfd.get('msg-map-' + message.reply_to_message.message_id, { type: "json" })
      if(guestChatId){
        return copyMessage({
          chat_id: guestChatId,
          from_chat_id: message.chat.id,
          message_id: message.message_id,
        })
      } else {
        return sendMessage({
          chat_id: ADMIN_UID,
          text: '⚠️ 找不到对应的用户映射'
        })
      }
    }
    return
  }
  
  // 普通用户消息处理
  return handleGuestMessage(message)
}

/**
 * 发送验证码
 */
async function sendCaptcha(chatId, isWelcome){
  let captcha = generateCaptcha()
  
  // 保存验证码答案和类型
  await nfd.put('captcha-' + chatId, captcha.answer, { expirationTtl: 600 })
  await nfd.put('captcha-type-' + chatId, captcha.type, { expirationTtl: 600 })
  
  let messageText, keyboard
  
  if(captcha.type === 'math'){
    messageText = isWelcome
      ? `🔐 数学验证

欢迎使用本机器人！
为防止滥用，首次使用需要验证。

📝 请计算：${captcha.question}

💡 提示：请输入计算结果（纯数字）`
      : `🔐 数学验证

你还未通过验证。

📝 请计算：${captcha.question}

💡 输入计算结果或 /start 换题`
  } else if(captcha.type === 'logic'){
    messageText = isWelcome
      ? `🔐 智力验证

欢迎使用本机器人！
为防止滥用，首次使用需要验证。

📝 ${captcha.question}

💡 提示：简单的逻辑题，输入数字答案`
      : `🔐 智力验证

你还未通过验证。

📝 ${captcha.question}

💡 简单逻辑题或 /start 换题`
  } else if(captcha.type === 'chinese'){
    messageText = isWelcome
      ? `🔐 中文数字验证

欢迎使用本机器人！
为防止滥用，首次使用需要验证。

📝 中文数字：${captcha.display}

💡 ${captcha.question}`
      : `🔐 中文数字验证

你还未通过验证。

📝 中文数字：${captcha.display}

💡 ${captcha.question}或 /start 换题`
  } else if(captcha.type === 'sequence'){
    messageText = isWelcome
      ? `🔐 逻辑验证

欢迎使用本机器人！
为防止滥用，首次使用需要验证。

📝 ${captcha.question}

💡 提示：观察规律，填入下一个数字`
      : `🔐 逻辑验证

你还未通过验证。

📝 ${captcha.question}

💡 观察规律或 /start 换题`
  } else if(captcha.type === 'time'){
    messageText = isWelcome
      ? `🔐 时间验证

欢迎使用本机器人！
为防止滥用，首次使用需要验证。

📝 时间：${captcha.display}

💡 ${captcha.question}`
      : `🔐 时间验证

你还未通过验证。

📝 时间：${captcha.display}

💡 ${captcha.question}或 /start 换题`
  } else if(captcha.type === 'button'){
    messageText = isWelcome
      ? `🔐 按钮验证

欢迎使用本机器人！
为防止滥用，首次使用需要验证。

📝 请计算：${captcha.question}

💡 点击下方正确答案`
      : `🔐 按钮验证

你还未通过验证。

📝 请计算：${captcha.question}

💡 点击正确答案或 /start 换题`
    
    // 保存选项列表到KV存储
    await nfd.put('captcha-options-' + chatId, JSON.stringify(captcha.options), { expirationTtl: 600 })
    
    // 生成按钮（使用索引而不是答案值，防止答案泄露）
    keyboard = {
      inline_keyboard: [
        captcha.options.slice(0, 2).map((opt, idx) => ({
          text: String(opt),
          callback_data: `verify_${chatId}_${idx}`
        })),
        captcha.options.slice(2, 4).map((opt, idx) => ({
          text: String(opt),
          callback_data: `verify_${chatId}_${idx + 2}`
        }))
      ]
    }
  }
  
  return sendMessage({
    chat_id: chatId,
    text: messageText,
    reply_markup: keyboard
  })
}

/**
 * 处理验证成功
 */
async function handleVerificationSuccess(chatId, from){
  await nfd.put('verified-' + chatId, true)
  await nfd.delete('captcha-' + chatId)
  await nfd.delete('captcha-type-' + chatId)
  
  // 通知管理员
  let userName = from.first_name || '匿名用户'
  if(from.username){
    userName += ` (@${from.username})`
  }
  await sendMessage({
    chat_id: ADMIN_UID,
    text: `✅ 新用户验证成功

👤 用户：${userName}\n
🆔 ID：${chatId}\n
⏰ 时间：${new Date().toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}`
  })
  
  return sendMessage({
    chat_id: chatId,
    text: '✅ 验证成功！\n\n👋 欢迎回来！\n\n请直接输入消息，主人收到就会回复你'
  })
}

/**
 * 处理按钮回调
 */
async function onCallbackQuery(callbackQuery){
  const data = callbackQuery.data
  const chatId = callbackQuery.message.chat.id
  
  if(data.startsWith('verify_')){
    const parts = data.split('_')
    const userId = parseInt(parts[1])
    const optionIndex = parseInt(parts[2])
    
    if(chatId !== userId){
      return requestTelegram('answerCallbackQuery', makeReqBody({
        callback_query_id: callbackQuery.id,
        text: '⚠️ 这不是你的验证码',
        show_alert: true
      }))
    }
    
    let expectedAnswer = await nfd.get('captcha-' + chatId)
    
    if(!expectedAnswer){
      return requestTelegram('answerCallbackQuery', makeReqBody({
        callback_query_id: callbackQuery.id,
        text: '⚠️ 验证码已过期，请发送 /start 重新获取',
        show_alert: true
      }))
    }
    
    // 获取选项列表
    let optionsJson = await nfd.get('captcha-options-' + chatId)
    if(!optionsJson){
      return requestTelegram('answerCallbackQuery', makeReqBody({
        callback_query_id: callbackQuery.id,
        text: '⚠️ 验证码已过期，请发送 /start 重新获取',
        show_alert: true
      }))
    }
    
    let options = JSON.parse(optionsJson)
    let userAnswer = String(options[optionIndex])
    
    if(userAnswer === expectedAnswer){
      // 验证成功
      await requestTelegram('answerCallbackQuery', makeReqBody({
        callback_query_id: callbackQuery.id,
        text: '✅ 验证成功！'
      }))
      
      // 删除选项数据
      await nfd.delete('captcha-options-' + chatId)
      
      await handleVerificationSuccess(chatId, callbackQuery.from)
    } else {
      // 验证失败
      await requestTelegram('answerCallbackQuery', makeReqBody({
        callback_query_id: callbackQuery.id,
        text: '❌ 答案错误，请重试',
        show_alert: true
      }))
    }
  }
}

async function handleGuestMessage(message){
  let chatId = message.chat.id;
  
  // 检查黑名单
  let isblocked = await nfd.get('isblocked-' + chatId, { type: "json" })
  if(isblocked){
    return sendMessage({
      chat_id: chatId,
      text:'⚠️ 你已被管理员拉黑，消息无法发送'
    })
  }
  
  // /start 命令 - 发送验证码或欢迎消息
  if(message.text === '/start'){
    if(enable_verification){
      let isVerified = await nfd.get('verified-' + chatId, { type: "json" })
      if(isVerified){
        return sendMessage({
          chat_id: chatId,
          text: '👋 欢迎回来！\n\n请直接输入消息，主人收到就会回复你'
        })
      } else {
        return sendCaptcha(chatId, true)
      }
    }
    return
  }
  
  // 验证码检查
  if(enable_verification){
    let isVerified = await nfd.get('verified-' + chatId, { type: "json" })
    if(!isVerified){
      let expectedAnswer = await nfd.get('captcha-' + chatId)
      
      if(expectedAnswer){
        let userInput = message.text ? message.text.trim() : ''
        
        if(userInput === expectedAnswer){
          // 验证成功
          return handleVerificationSuccess(chatId, message.from)
        } else {
          // 验证失败
          return sendMessage({
            chat_id: chatId,
            text: '❌ 验证码错误！\n\n请仔细检查后重新输入\n或发送 /start 获取新的验证题'
          })
        }
      } else {
        // 没有验证码，生成新的
        return sendCaptcha(chatId, false)
      }
    }
  }

  // 构建用户信息
  let userName = message.from.first_name || '匿名用户'
  if(message.from.last_name){
    userName += ' ' + message.from.last_name
  }
  let userTag = message.from.username ? `(@${message.from.username})` : `(ID: ${chatId})`
  let userInfo = `📨 来自 ${userName}${userTag}`
  
  // 转发原始消息
  let forwardReq = await forwardMessage({
    chat_id: ADMIN_UID,
    from_chat_id: message.chat.id,
    message_id: message.message_id
  })
  
  if(forwardReq.ok){
    await nfd.put('msg-map-' + forwardReq.result.message_id, chatId)
  }
  
  return handleNotify(message)
}

async function handleNotify(message){
  // 先判断是否是诈骗人员，如果是，则直接提醒
  // 如果不是，则根据时间间隔提醒：用户id，交易注意点等
  let chatId = message.chat.id;
  if(await isFraud(chatId)){
    return sendMessage({
      chat_id: ADMIN_UID,
      text:`检测到骗子，UID${chatId}`
    })
  }
  if(enable_notification){
    let lastMsgTime = await nfd.get('lastmsg-' + chatId, { type: "json" })
    if(!lastMsgTime || Date.now() - lastMsgTime > NOTIFY_INTERVAL){
      await nfd.put('lastmsg-' + chatId, Date.now())
      return sendMessage({
        chat_id: ADMIN_UID,
        text:await fetch(notificationUrl).then(r => r.text())
      })
    }
  }
}

async function handleBlock(message){
  if(!message.reply_to_message || !message.reply_to_message.message_id){
    return sendMessage({
      chat_id: ADMIN_UID,
      text: '⚠️ 请回复用户消息后使用 /block 命令'
    })
  }
  
  let guestChatId = await nfd.get('msg-map-' + message.reply_to_message.message_id, { type: "json" })
  
  if(!guestChatId){
    return sendMessage({
      chat_id: ADMIN_UID,
      text: '⚠️ 找不到对应的用户映射'
    })
  }
  
  if(guestChatId === ADMIN_UID){
    return sendMessage({
      chat_id: ADMIN_UID,
      text:'⚠️ 不能屏蔽自己'
    })
  }
  
  await nfd.put('isblocked-' + guestChatId, true)

  return sendMessage({
    chat_id: ADMIN_UID,
    text: `🚫 已将用户 ${guestChatId} 加入黑名单`,
  })
}

async function handleUnBlock(message){
  if(!message.reply_to_message || !message.reply_to_message.message_id){
    return sendMessage({
      chat_id: ADMIN_UID,
      text: '⚠️ 请回复用户消息后使用 /unblock 命令'
    })
  }
  
  let guestChatId = await nfd.get('msg-map-' + message.reply_to_message.message_id, { type: "json" })
  
  if(!guestChatId){
    return sendMessage({
      chat_id: ADMIN_UID,
      text: '⚠️ 找不到对应的用户映射'
    })
  }
  
  await nfd.delete('isblocked-' + guestChatId)

  return sendMessage({
    chat_id: ADMIN_UID,
    text: `✅ 已将用户 ${guestChatId} 从黑名单移除`,
  })
}

async function checkBlock(message){
  // 获取所有黑名单用户（需要遍历KV，这里简化处理）
  return sendMessage({
    chat_id: ADMIN_UID,
    text: '📋 黑名单功能\n\n由于KV存储限制，请使用 /block 和 /unblock 命令管理黑名单\n\n使用方法：回复用户消息后发送对应命令'
  })
}

async function isFraud(chatId){
  try {
    let fraudList = await fetch(fraudDb).then(r => r.text())
    return fraudList.includes(chatId.toString())
  } catch(e) {
    return false
  }
}

/**
 * Register webhook for Telegram
 */
async function registerWebhook(event, requestUrl, suffix, secret){
  const webhookUrl = `${requestUrl.protocol}//${requestUrl.hostname}${suffix}`
  const r = await fetch(apiUrl('setWebhook', {
    url: webhookUrl,
    secret_token: secret
  }))
  
  return new Response(await r.text(), {
    headers: { 'content-type': 'application/json' }
  })
}

/**
 * Unregister webhook
 */
async function unRegisterWebhook(event){
  const r = await fetch(apiUrl('deleteWebhook'))
  return new Response(await r.text(), {
    headers: { 'content-type': 'application/json' }
  })
}

async function handleUnBlock(message){
  let guestChantId = await nfd.get('msg-map-' + message.reply_to_message.message_id,
  { type: "json" })

  await nfd.put('isblocked-' + guestChantId, false)

  return sendMessage({
    chat_id: ADMIN_UID,
    text:`UID:${guestChantId}解除屏蔽成功`,
  })
}

async function checkBlock(message){
  let guestChantId = await nfd.get('msg-map-' + message.reply_to_message.message_id,
  { type: "json" })
  let blocked = await nfd.get('isblocked-' + guestChantId, { type: "json" })

  return sendMessage({
    chat_id: ADMIN_UID,
    text: `UID:${guestChantId}` + (blocked ? '被屏蔽' : '没有被屏蔽')
  })
}

/**
 * 取消用户验证
 */
async function handleUnverify(message){
  let guestChatId = null
  
  // 检查是否是 /uv TGID 格式
  if(message.text && message.text.trim().startsWith('/uv ')){
    const parts = message.text.trim().split(/\s+/)
    if(parts.length === 2 && /^\d+$/.test(parts[1])){
      // /uv 123456789 格式
      guestChatId = parseInt(parts[1])
    } else {
      return sendMessage({
        chat_id: ADMIN_UID,
        text: '⚠️ 使用方法：\n\n1️⃣ 回复用户消息后使用 /uv 命令\n2️⃣ 使用 /uv <用户ID> 直接指定用户\n\n示例：/uv 123456789'
      })
    }
  } 
  // /uv 命令 - 回复消息取消验证
  else if(message.reply_to_message && message.reply_to_message.message_id){
    guestChatId = await nfd.get('msg-map-' + message.reply_to_message.message_id, { type: "json" })
    
    if(!guestChatId){
      return sendMessage({
        chat_id: ADMIN_UID,
        text: '⚠️ 找不到对应的用户映射'
      })
    }
  } 
  else {
    return sendMessage({
      chat_id: ADMIN_UID,
      text: '⚠️ 使用方法：\n\n1️⃣ 回复用户消息后使用 /uv 命令\n2️⃣ 使用 /uv <用户ID> 直接指定用户\n\n示例：/uv 123456789'
    })
  }
  
  // 检查用户是否已验证
  let isVerified = await nfd.get('verified-' + guestChatId, { type: "json" })
  
  if(!isVerified){
    return sendMessage({
      chat_id: ADMIN_UID,
      text: `⚠️ 用户 ${guestChatId} 尚未验证或已被取消验证,该用户需要验证答题后才能发送消息`
    })
  }
  
  // 删除用户验证状态
  await nfd.delete('verified-' + guestChatId)
  
  return sendMessage({
    chat_id: ADMIN_UID,
    text: `✅ 已取消用户 ${guestChatId} 的验证\n\n该用户需要重新验证后才能发送消息`
  })
}

/**
 * Send plain text message
 * https://core.telegram.org/bots/api#sendmessage
 */
async function sendPlainText (chatId, text) {
  return sendMessage({
    chat_id: chatId,
    text
  })
}

/**
 * Set webhook to this worker's url
 * https://core.telegram.org/bots/api#setwebhook
 */
async function registerWebhook (event, requestUrl, suffix, secret) {
  // https://core.telegram.org/bots/api#setwebhook
  const webhookUrl = `${requestUrl.protocol}//${requestUrl.hostname}${suffix}`
  const r = await (await fetch(apiUrl('setWebhook', { url: webhookUrl, secret_token: secret }))).json()
  return new Response('ok' in r && r.ok ? 'Ok' : JSON.stringify(r, null, 2))
}

/**
 * Remove webhook
 * https://core.telegram.org/bots/api#setwebhook
 */
async function unRegisterWebhook (event) {
  const r = await (await fetch(apiUrl('setWebhook', { url: '' }))).json()
  return new Response('ok' in r && r.ok ? 'Ok' : JSON.stringify(r, null, 2))
}

/**
 * 查看验证功能状态
 */
async function handleVerificationStatus(message){
  // 从KV存储获取验证功能开关状态
  try {
    const verificationStatus = await nfd.get('enable_verification', { type: "json" })
    const currentStatus = verificationStatus !== null ? verificationStatus : true
    
    return sendMessage({
      chat_id: ADMIN_UID,
      text: `📊 验证功能状态：${currentStatus ? '已开启' : '已关闭'}\n\n使用 /enableVerification 开启验证功能\n使用 /disableVerification 关闭验证功能`
    })
  } catch (e) {
    return sendMessage({
      chat_id: ADMIN_UID,
      text: '❌ 获取验证功能状态失败：' + e.message
    })
  }
}

/**
 * 开启验证功能
 */
async function handleEnableVerification(message){
  try {
    await nfd.put('enable_verification', true, { type: "json" })
    
    return sendMessage({
      chat_id: ADMIN_UID,
      text: '✅ 验证功能已开启'
    })
  } catch (e) {
    return sendMessage({
      chat_id: ADMIN_UID,
      text: '❌ 开启验证功能失败：' + e.message
    })
  }
}

/**
 * 关闭验证功能
 */
async function handleDisableVerification(message){
  try {
    await nfd.put('enable_verification', false, { type: "json" })
    
    return sendMessage({
      chat_id: ADMIN_UID,
      text: '✅ 验证功能已关闭'
    })
  } catch (e) {
    return sendMessage({
      chat_id: ADMIN_UID,
      text: '❌ 关闭验证功能失败：' + e.message
    })
  }
}

async function isFraud(id){
  id = id.toString()
  let db = await fetch(fraudDb).then(r => r.text())
  let arr = db.split('\n').filter(v => v)
  console.log(JSON.stringify(arr))
  let flag = arr.filter(v => v === id).length !== 0
  console.log(flag)
  return flag
}
