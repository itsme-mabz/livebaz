// services/websocketService.js
class WebSocketService {
  constructor() {
    this.socket = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  connect() {
    try {
      // Connect to local backend WebSocket relay
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname;
      const wsPort = '3000'; // Default backend port

      this.socket = new WebSocket(`${wsProtocol}//${wsHost}:${wsPort}`);

      this.socket.onopen = () => {
        console.log('WebSocket Connected for live scores');
        this.reconnectAttempts = 0;
        this.notifySubscribers('connected', { status: 'connected' });
      };

      this.socket.onmessage = (event) => {
        if (event.data) {
          try {
            const data = JSON.parse(event.data);
            console.log('Live data received:', data);
            this.notifySubscribers('liveData', data);
          } catch (error) {
            console.error('Error parsing WebSocket data:', error);
          }
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.notifySubscribers('disconnected', {
          status: 'disconnected',
          code: event.code,
          reason: event.reason
        });
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifySubscribers('error', { error });
      };

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.notifySubscribers('maxReconnects', {
        message: 'Failed to establish WebSocket connection'
      });
    }
  }

  subscribe(id, callback) {
    this.subscribers.set(id, callback);
    return () => this.unsubscribe(id);
  }

  unsubscribe(id) {
    this.subscribers.delete(id);
  }

  notifySubscribers(type, data) {
    this.subscribers.forEach((callback) => {
      try {
        callback(type, data);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect');
      this.socket = null;
    }
    this.subscribers.clear();
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();