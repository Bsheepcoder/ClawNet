/**
 * OpenClaw 实例管理服务
 * 管理 OpenClaw 多实例的生命周期、网关控制和 ClawNet 连接
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(require('child_process').exec);

export interface OpenClawInstance {
  id: string;
  name: string;
  port: number;
  profileDir: string;
  status: 'running' | 'stopped';
  isMain?: boolean;
  wechat?: {
    accountId?: string;
    userId?: string;
    loggedIn: boolean;
    lastLoginAt?: string;
  };
  gateway?: {
    running: boolean;
    pid?: number;
    port: number;
    lastStartedAt?: string;
  };
  clawnet?: {
    connected: boolean;
    nodeId?: string;
    connectedAt?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface CreateInstanceOptions {
  name: string;
  autoInstallWeixin?: boolean;
}

export interface GatewayControl {
  start: boolean;
  stop: boolean;
  restart: boolean;
  status: boolean;
}

const HOME_DIR = process.env.HOME || '/root';
const INSTANCES_BASE_DIR = path.join(HOME_DIR, '.openclaw');
const INSTANCES_CONFIG_FILE = path.join(INSTANCES_BASE_DIR, 'instances.json');

/**
 * 实例管理器
 */
export class InstanceManager {
  private instances: Map<string, OpenClawInstance> = new Map();

  constructor() {
    this.loadInstances();
  }

  /**
   * 从文件加载所有实例配置
   */
  private loadInstances(): void {
    try {
      if (fs.existsSync(INSTANCES_CONFIG_FILE)) {
        const data = fs.readFileSync(INSTANCES_CONFIG_FILE, 'utf-8');
        const instances = JSON.parse(data);
        this.instances = new Map(Object.entries(instances).map(([id, config]: [string, any]) => [
          id,
          {
            id,
            name: config.name || id,
            port: config.port || this.calculatePort(id),
            profileDir: config.profileDir || path.join(HOME_DIR, `.openclaw-${id}`),
            status: config.status || 'stopped',
            isMain: config.isMain || false,
            wechat: config.wechat || { loggedIn: false },
            gateway: config.gateway || { running: false, port: this.calculatePort(id) },
            clawnet: config.clawnet || { connected: false },
            createdAt: config.createdAt || new Date().toISOString(),
            updatedAt: config.updatedAt || new Date().toISOString()
          }
        ]));
        console.log(`[instance-manager] Loaded ${this.instances.size} instances`);
      }
    } catch (error) {
      console.error(`[instance-manager] Failed to load instances: ${String(error)}`);
    }
  }

  /**
   * 保存所有实例配置
   */
  private saveInstances(): void {
    try {
      const data = Object.fromEntries(this.instances.entries());
      fs.writeFileSync(INSTANCES_CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error(`[instance-manager] Failed to save instances: ${String(error)}`);
    }
  }

  /**
   * 计算端口
   */
  private calculatePort(name: string): number {
    const hash = name.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    return 19000 + (hash % 100);
  }

  /**
   * 检查端口是否在监听
   */
  private async checkPortListening(port: number): Promise<boolean> {
    try {
      const result = await execAsync(`netstat -tlnp 2>/dev/null | grep :${port}`);
      return result.stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * 检查微信是否已登录
   */
  private checkWechatLoggedIn(instance: OpenClawInstance): void {
    try {
      const wechatDir = path.join(instance.profileDir, 'openclaw-weixin');
      const accountsListFile = path.join(wechatDir, 'accounts.json');
      
      // 总是重新读取 accounts.json 获取最新账号列表
      if (fs.existsSync(accountsListFile)) {
        const accountsList = JSON.parse(fs.readFileSync(accountsListFile, 'utf-8'));
        
        if (Array.isArray(accountsList) && accountsList.length > 0) {
          // 使用最新的账号（最后一个）
          const latestAccountId = accountsList[accountsList.length - 1];
          
          // 更新实例配置中的 accountId
          instance.wechat = instance.wechat || { loggedIn: false };
          instance.wechat.accountId = latestAccountId;
          
          console.log(`[instance-manager] Found latest WeChat account for ${instance.name}: ${latestAccountId}`);
          
          // 检查账号文件是否存在
          const accountFile = path.join(wechatDir, 'accounts', `${latestAccountId}.json`);
          
          if (fs.existsSync(accountFile)) {
            const accountData = JSON.parse(fs.readFileSync(accountFile, 'utf-8'));
            instance.wechat.loggedIn = true;
            instance.wechat.userId = accountData.userId;
            instance.wechat.lastLoginAt = accountData.savedAt;
            console.log(`[instance-manager] ✓ WeChat logged in for ${instance.name}: ${latestAccountId}`);
          } else {
            instance.wechat.loggedIn = false;
            console.log(`[instance-manager] ✗ WeChat account file not found: ${accountFile}`);
          }
        } else {
          instance.wechat = { loggedIn: false };
          console.log(`[instance-manager] No WeChat accounts found for ${instance.name}`);
        }
      } else {
        instance.wechat = { loggedIn: false };
        console.log(`[instance-manager] No WeChat config for ${instance.name}`);
      }
    } catch (error) {
      console.warn(`[instance-manager] Failed to check WeChat login: ${String(error)}`);
    }
  }

  /**
   * 更新实例状态（检查 Gateway 和微信登录）
   */
  private async updateInstanceStatus(id: string): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) return;

    if (instance.gateway) {
      instance.gateway.running = await this.checkPortListening(instance.port);
    } else {
      instance.gateway = { running: false, port: instance.port };
    }
    
    this.checkWechatLoggedIn(instance);
    instance.updatedAt = new Date().toISOString();
    this.instances.set(id, instance);
    this.saveInstances();
  }

  /**
   * 获取所有实例
   */
  async listAll(): Promise<OpenClawInstance[]> {
    return Array.from(this.instances.values());
  }

  /**
   * 获取单个实例
   */
  async getInstance(id: string): Promise<OpenClawInstance | null> {
    const instance = this.instances.get(id);
    if (!instance) return null;
    
    await this.updateInstanceStatus(id);
    return instance;
  }

  /**
   * 创建新实例
   */
  async createInstance(options: CreateInstanceOptions): Promise<{ success: boolean; instance?: OpenClawInstance; message?: string }> {
    const { name, autoInstallWeixin = true } = options;

    if (!name || !/^[a-z0-9_-]+$/i.test(name)) {
      return {
        success: false,
        message: 'Invalid instance name (alphanumeric, dash, underscore only)'
      };
    }

    if (this.instances.has(name)) {
      return {
        success: false,
        message: 'Instance already exists'
      };
    }

    const port = this.calculatePort(name);
    const profileDir = path.join(HOME_DIR, `.openclaw-${name}`);
    const createdAt = new Date().toISOString();

    try {
      fs.mkdirSync(INSTANCES_BASE_DIR, { recursive: true });
      fs.mkdirSync(profileDir, { recursive: true });

      const instance: OpenClawInstance = {
        id: name,
        name,
        port,
        profileDir,
        status: 'stopped',
        wechat: { loggedIn: false },
        gateway: { running: false, port: port },
        clawnet: { connected: false },
        createdAt
      };

      this.instances.set(name, instance);
      this.saveInstances();

      // 自动安装微信插件（失败不阻止实例创建）
      if (autoInstallWeixin) {
        try {
          await this.installWeixinPlugin(name);
        } catch (error: any) {
          console.warn(`[instance-manager] WeChat plugin installation failed for ${name}: ${error.message}`);
          console.warn(`[instance-manager] Instance created successfully, but plugin needs manual installation`);
          // 不抛出错误，实例已创建成功
        }
      }

      return {
        success: true,
        instance
      };
    } catch (error) {
      return {
        success: false,
        message:String(error) ||String(error)
      };
    }
  }

  /**
   * 安装微信插件
   */
  private async installWeixinPlugin(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`[instance-manager] Installing WeChat plugin for ${name}...`);
      
      const child = spawn('openclaw', ['--profile', name, 'plugins', 'install', '@tencent-weixin/openclaw-weixin'], {
        stdio: ['ignore', 'pipe', 'pipe'] // 捕获输出
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
        console.log(`[plugin-install][${name}] ${data.toString().trim()}`);
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
        console.error(`[plugin-install][${name}] ERROR: ${data.toString().trim()}`);
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`[instance-manager] WeChat plugin installed for ${name}`);
          resolve();
        } else {
          const errorMsg = `Failed to install WeChat plugin: exit code ${code}\nstdout: ${stdout}\nstderr: ${stderr}`;
          console.error(`[instance-manager] ${errorMsg}`);
          reject(new Error(errorMsg));
        }
      });

      child.on('error', (error) => {
        console.error(`[instance-manager] Failed to spawn plugin install: ${error.message}`);
        reject(new Error(`Failed to run plugin install: ${error.message}`));
      });

      // 超时时间改为 60 秒
      setTimeout(() => {
        child.kill();
        reject(new Error('Plugin installation timeout (60s)'));
      }, 60000);
    });
  }

  /**
   * 启动 Gateway
   */
  async startGateway(id: string): Promise<{ success: boolean; message?: string }> {
    const instance = this.instances.get(id);
    if (!instance) {
      return { success: false, message: 'Instance not found' };
    }

    if (instance.status === 'running') {
      return { success: false, message: 'Instance already running' };
    }

    try {
      const pid = await this.startOpenClawGateway(instance);
      
      if (!instance.gateway) {
        instance.gateway = { running: false, port: instance.port };
      }
      
      instance.gateway.running = true;
      instance.gateway.pid = pid;
      instance.gateway.port = instance.port;
      instance.gateway.lastStartedAt = new Date().toISOString();
      instance.status = 'running';
      instance.updatedAt = new Date().toISOString();

      this.instances.set(id, instance);
      this.saveInstances();

      return {
        success: true,
        message: `Gateway started (PID: ${pid})`
      };
    } catch (error: any) {
      return {
        success: false,
        message:String(error) ||String(error)
      };
    }
  }

  /**
   * 停止 Gateway
   */
  async stopGateway(id: string, force = false): Promise<{ success: boolean; message?: string }> {
    const instance = this.instances.get(id);
    if (!instance) {
      return { success: false, message: 'Instance not found' };
    }

    try {
      if (instance.gateway?.pid) {
        try {
          await this.stopProcess(instance.gateway.pid, force);
        } catch (error: any) {
          // 进程可能已经不存在（ESRCH），继续清理状态
          console.warn(`[instance-manager] Process ${instance.gateway.pid} may already be dead: ${error.message}`);
        }
        
        // 无论进程是否还存在，都清理状态
        instance.gateway.running = false;
        instance.gateway.pid = undefined;
        instance.status = 'stopped';
        instance.updatedAt = new Date().toISOString();

        this.instances.set(id, instance);
        this.saveInstances();

        return { success: true, message: 'Gateway stopped' };
      }

      return { success: false, message: 'Gateway not running' };
    } catch (error: any) {
      return {
        success: false,
        message: String(error) || String(error)
      };
    }
  }

  /**
   * 连接到 ClawNet
   */
  async connectToClawnet(id: string, clawnetUrl: string = 'http://localhost:3000'): Promise<{ success: boolean; message?: string }> {
    const instance = this.instances.get(id);
    if (!instance) {
      return { success: false, message: 'Instance not found' };
    }

    try {
      const response = await fetch(`${clawnetUrl}/nodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer clawnet-secret-token'
        },
        body: JSON.stringify({
          id: `openclaw-${id}`,
          type: 'bot',
          name: `OpenClaw-${id}`,
          metadata: {
            port: instance.port,
            source: 'openclaw-instance'
          }
        })
      });

      if (response.ok) {
        if (!instance.clawnet) {
          instance.clawnet = { connected: false };
        }
        
        instance.clawnet.connected = true;
        instance.clawnet.nodeId = `openclaw-${id}`;
        instance.clawnet.connectedAt = new Date().toISOString();
        instance.updatedAt = new Date().toISOString();

        this.instances.set(id, instance);
        this.saveInstances();

        return { success: true, message: 'Connected to ClawNet' };
      } else {
        const error = await response.json();
        return { success: false, message: String((error as any)?.error || 'Failed to connect') };
      }
    } catch (error: any) {
      return { success: false, message:String(error) ||String(error) };
    }
  }

  /**
   * 删除实例
   */
  async deleteInstance(id: string): Promise<{ success: boolean; message?: string }> {
    const instance = this.instances.get(id);
    if (!instance) {
      return { success: false, message: 'Instance not found' };
    }

    try {
      if (instance.gateway?.pid) {
        await this.stopProcess(instance.gateway.pid);
      }

      const profileDir = instance.profileDir;
      if (fs.existsSync(profileDir)) {
        fs.rmSync(profileDir, { recursive: true });
      }

      this.instances.delete(id);
      this.saveInstances();

      return { success: true, message: 'Instance deleted' };
    } catch (error: any) {
      return { success: false, message:String(error) ||String(error) };
    }
  }

  /**
   * 获取微信登录二维码
   */
  async getWechatQR(id: string): Promise<{ success: boolean; qrUrl?: string; message?: string }> {
    const instance = this.instances.get(id);
    if (!instance) {
      return { success: false, message: 'Instance not found' };
    }

    return {
      success: false,
      message: 'Please use CLI to login: clawnet instance login ' + id
    };
  }

  /**
   * 微信登录
   */
  async wechatLogin(id: string): Promise<{ success: boolean; accountId?: string; userId?: string; message?: string }> {
    const instance = this.instances.get(id);
    if (!instance) {
      return { success: false, message: 'Instance not found' };
    }

    return new Promise((resolve, reject) => {
      const child = spawn('openclaw', ['--profile', id, 'channels', 'login', '--channel', 'openclaw-weixin'], {
        stdio: 'inherit'
      });

      child.on('close', async (code) => {
        if (code === 0) {
          await this.updateInstanceStatus(id);
          const instance = this.instances.get(id);
          const wechat = instance?.wechat;
          
          resolve({
            success: true,
            accountId: wechat?.accountId,
            userId: wechat?.userId,
            message: 'Login successful'
          });
        } else {
          reject(new Error(`Login failed with code ${code}`));
        }
      });

      setTimeout(() => {
        child.kill();
        reject(new Error('Login timeout'));
      }, 120000);
    });
  }

  /**
   * 启动 OpenClaw Gateway
   */
  private async startOpenClawGateway(instance: OpenClawInstance): Promise<number> {
    return new Promise((resolve) => {
      const child = spawn('openclaw', ['--profile', instance.id, 'gateway', 'start'], {
        detached: true,
        stdio: 'ignore'
      });

      setTimeout(() => {
        child.unref();
        const pid = child.pid || 0;
        resolve(pid);
      }, 1000);
    });
  }

  /**
   * 停止进程
   */
  private async stopProcess(pid: number, force: boolean = false): Promise<void> {
    if (!pid) return;

    try {
      if (force) {
        process.kill(pid, 'SIGKILL');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        process.kill(pid, 'SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 检查是否停止
        let attempts = 0;
        while (attempts < 5) {
          try {
            process.kill(pid, 0);
          } catch {}
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
      }
    } catch (error) {
      console.warn(`[instance-manager] Failed to stop process: ${String(error)}`);
      throw error;
    }
  }
}

// 创建全局实例管理器
const instanceManager = new InstanceManager();

// 导出实例管理函数
export async function listInstances(clawnetUrl: string = 'http://localhost:3000'): Promise<OpenClawInstance[]> {
  return await instanceManager.listAll();
}

export async function getInstance(name: string): Promise<OpenClawInstance | null> {
  return await instanceManager.getInstance(name);
}

export async function createInstance(options: CreateInstanceOptions): Promise<{ success: boolean; instance?: OpenClawInstance; message?: string }> {
  return await instanceManager.createInstance(options);
}

export async function startInstance(name: string): Promise<{ success: boolean; message?: string }> {
  return await instanceManager.startGateway(name);
}

export async function stopInstance(name: string): Promise<{ success: boolean; message?: string }> {
  return await instanceManager.stopGateway(name);
}

export async function connectInstance(name: string, clawnetUrl: string = 'http://localhost:3000'): Promise<{ success: boolean; message?: string }> {
  return await instanceManager.connectToClawnet(name, clawnetUrl);
}

export async function deleteInstance(name: string): Promise<{ success: boolean; message?: string }> {
  return await instanceManager.deleteInstance(name);
}
