const WebSocket = require('ws');
const http = require('http');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

function setupWebSocket(server) {
  // Tạo WebSocket server
  const wss = new WebSocket.Server({ server });
  
  // Lưu trữ các kết nối active
  const clients = new Map();
  const adminClients = new Set();
  
  // Xử lý khi có client kết nối
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    // Xử lý xác thực
    let userId = null;
    let isAdmin = false;
    let isAuthenticated = false;
    
    // Xử lý tin nhắn từ client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        // Xử lý xác thực
        if (data.type === 'authenticate') {
          // Xác thực token
          try {
            const decoded = jwt.verify(data.token, JWT_SECRET);
            userId = decoded.userId || decoded._id;
            isAdmin = decoded.role === 'admin' || decoded.isAdmin === true;
            isAuthenticated = true;
            
            // Lưu kết nối theo userId
            clients.set(userId, ws);
            
            // Thêm vào danh sách admin nếu là admin
            if (isAdmin) {
              adminClients.add(ws);
              console.log(`Admin connected: ${userId}`);
            } else {
              console.log(`User connected: ${userId}`);
            }
            
            // Gửi xác nhận kết nối thành công
            ws.send(JSON.stringify({
              type: 'connection_status',
              status: 'connected',
              userId,
              isAdmin
            }));
          } catch (err) {
            console.error('Authentication error:', err);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Authentication failed',
              details: err.message
            }));
          }
        }
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    });
    
    // Xử lý ngắt kết nối
    ws.on('close', () => {
      if (userId) {
        clients.delete(userId);
        console.log(`Client disconnected: ${userId}`);
      }
      
      // Xóa khỏi danh sách admin
      if (isAdmin) {
        adminClients.delete(ws);
        console.log('Admin disconnected');
      }
    });
  });
  
  // Trả về các phương thức để tương tác với WebSocket server
  return {
    // Gửi thông báo đến tất cả clients
    broadcast: (message) => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    },
    
    // Gửi thông báo đến một user cụ thể
    sendToUser: (userId, message) => {
      const client = clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    },
    
    // Gửi thông báo đến tất cả admin
    notifyAdmins: (message) => {
      adminClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    },
    
    // Thông báo khi có đăng ký Premium mới
    notifyNewPremium: (subscriptionData) => {
      adminClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'premium_subscription',
            action: 'new',
            data: subscriptionData
          }));
        }
      });
    },
    
    // Thông báo khi trạng thái đăng ký Premium thay đổi
    notifyPremiumStatusChange: (subscriptionId, newStatus, userId) => {
      // Thông báo cho admin
      adminClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'premium_subscription',
            action: 'status_change',
            subscriptionId,
            newStatus
          }));
        }
      });
      
      // Thông báo cho người dùng liên quan
      if (userId) {
        const userClient = clients.get(userId);
        if (userClient && userClient.readyState === WebSocket.OPEN) {
          userClient.send(JSON.stringify({
            type: 'premium_subscription',
            action: 'status_change',
            subscriptionId,
            newStatus
          }));
        }
      }
    }
  };
}

module.exports = setupWebSocket;