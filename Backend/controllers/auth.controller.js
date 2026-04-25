import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const prisma = new PrismaClient();

export const signup = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, brokerType: user.brokerType, brokerAccessExpiry: user.brokerAccessExpiry }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.status(200).json({ user: { id: user.id, email: user.email, name: user.name, brokerType: user.brokerType, brokerAccessExpiry: user.brokerAccessExpiry }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const googleLogin = async (req, res) => {
  const { tokenId } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture, sub } = ticket.getPayload();

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          avatar: picture,
          googleId: sub,
        },
      });
    } else if (!user.googleId) {
      // Link google account if email matches but googleId is missing
      user = await prisma.user.update({
        where: { email },
        data: { googleId: sub, avatar: picture },
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.status(200).json({ user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, brokerType: user.brokerType, brokerAccessExpiry: user.brokerAccessExpiry }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, avatar: true, brokerType: true, brokerApiKey: true, brokerAccessExpiry: true }
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user' });
  }
};
