import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createAlert = async (req, res) => {
    try {
        const { symbol, targetPrice, type } = req.body;
        const userId = req.user.id;

        const alert = await prisma.alert.create({
            data: {
                symbol,
                targetPrice: parseFloat(targetPrice),
                type,
                userId
            }
        });

        res.status(201).json(alert);
    } catch (error) {
        console.error('Create Alert Error:', error);
        res.status(500).json({ error: 'Failed to create alert' });
    }
};

export const getAlerts = async (req, res) => {
    try {
        const alerts = await prisma.alert.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
};

export const deleteAlert = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.alert.delete({
            where: { id, userId: req.user.id }
        });
        res.json({ message: 'Alert deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete alert' });
    }
};
