import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as XLSX from 'xlsx';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

const SALT_ROUNDS = 10;
const DEFAULT_ROLE: Role = Role.VOLUNTEER;

function generatePassword(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(crypto.randomFillSync(new Uint8Array(length)))
    .map((b) => chars[b % chars.length])
    .join('');
}

function emailToName(email: string): string {
  const part = email.split('@')[0];
  if (!part) return 'Invited User';
  return part.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

@Injectable()
export class InvitesService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const host = this.config.get('SMTP_HOST');
    const port = this.config.get('SMTP_PORT');
    const user = this.config.get('SMTP_USER');
    const pass = this.config.get('SMTP_PASS');
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port ? parseInt(port, 10) : 587,
        secure: port === '465',
        auth: { user, pass },
      });
    }
  }

  extractUsersFromExcel(buffer: Buffer): { email: string; role: Role }[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<any>(sheet);
  
    const users: { email: string; role: Role }[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    for (const row of data) {
      const email = String(row.Email || row.email || '').trim().toLowerCase();
      const roleValue = String(row.Role || row.role || '').toUpperCase();
  
      if (!emailRegex.test(email)) continue;
  
      let role: Role;
  
      if (Role[roleValue as keyof typeof Role]) {
        role = Role[roleValue as keyof typeof Role];
      } else {
        role = DEFAULT_ROLE;
      }
  
      users.push({ email, role });
    }
  
    return users;
  }

  async sendInvites(file: Express.Multer.File): Promise<{
    created: number;
    skipped: number;
    failed: string[];
    errors: string[];
  }> {
    const users = this.extractUsersFromExcel(file.buffer);
    if (users.length === 0) {
      return { created: 0, skipped: 0, failed: [], errors: ['No valid email addresses found in the file.'] };
    }

    const portalUrl = this.config.get('PORTAL_URL', 'http://localhost:8080');
    const techFestName = this.config.get('TECHFEST_NAME', 'Tech Fest');
    const techFestBrief = this.config.get(
      'TECHFEST_BRIEF',
      'Join us for an exciting tech fest featuring workshops, hackathons, and networking opportunities.',
    );

    let created = 0;
    let skipped = 0;
    const failed: string[] = [];
    const errors: string[] = [];

    for (const { email, role } of users) {
      try {
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
          skipped++;
          continue;
        }

        const plainPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
        const name = emailToName(email);

        await this.prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: role,
          },
        });
        created++;

        if (this.transporter) {
          await this.transporter.sendMail({
            from: this.config.get('SMTP_FROM', this.config.get('SMTP_USER', 'noreply@techfest.com')),
            to: email,
            subject: `You're Invited to ${techFestName} Management Portal`,
            html: `
              <h2>Welcome to ${techFestName}!</h2>
              <p>${techFestBrief}</p>
              <p>You have been invited to access the <strong>${techFestName} Management Portal</strong>.</p>
              <h3>Your Login Credentials</h3>
              <ul>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Password:</strong> ${plainPassword}</li>
              </ul>
              <p><a href="${portalUrl}/login" style="display:inline-block;padding:10px 20px;background:#6366f1;color:white;text-decoration:none;border-radius:6px;">Login to Portal</a></p>
              <p style="color:#666;font-size:12px;">Please change your password after first login. Keep these credentials secure.</p>
            `,
          });
        } else {
          errors.push(`SMTP not configured. User ${email} was created but no email was sent.`);
        }
      } catch (err) {
        failed.push(email);
        errors.push(`${email}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return { created, skipped, failed, errors };
  }
}
