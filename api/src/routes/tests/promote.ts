import { NextFunction, Request, Response } from 'express';
import DB from '@/lib/DB';
import { z } from 'zod';
import { ExperimentError } from '@/lib/Errors/ExperimentError';
import { ulid } from 'ulid';

const zPromoteParams = z.object({
    variation_id: z.string()
});

export async function promote(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { test_id } = req.params;

    try {
        const { variation_id } = await zPromoteParams.parseAsync(req.body);

        // 1. Get the test
        const test = await DB.Tests.getById(test_id);
        if (!test) {
            throw new ExperimentError('Test not found', { test_id });
        }

        // 2. Validate variation belongs to test
        const targetVariation = test.variations.find(v => v.id === variation_id);
        if (!targetVariation) {
            throw new ExperimentError('Variation not found in test', { test_id, variation_id });
        }

        // 3. Find current control
        const currentControl = test.variations.find(v => v.is_control);
        const previous_control_id = currentControl ? currentControl.id : null;

        // If already control, no-op
        if (currentControl && currentControl.id === variation_id) {
            res.status(200).json({
                success: true,
                message: 'Variation is already control',
                test
            });
            return;
        }

        // 4. Update variations
        // We map to a new array to ensure we update the object references
        const updatedVariations = test.variations.map(v => {
            if (v.id === variation_id) {
                return { ...v, is_control: true };
            }
            if (v.is_control) {
                return { ...v, is_control: false };
            }
            return v;
        });

        // 5. Save Test
        await DB.Tests.updateById(test_id, {
            variations: updatedVariations
        });

        // 6. Log History
        // Assuming req.user is populated by some auth middleware, otherwise null/system
        const user_id = (req.user as any)?.id;



        await DB.StatusLogs.insert({
            id: ulid(),
            created_at: new Date(),
            test_id,
            type: 'test',
            data: {
                status: 'PROMOTION',
                previous_control: previous_control_id,
                new_control: variation_id,
                user_id,
                reason: 'User promoted variation'
            }
        });

        res.status(200).json({ success: true, test_id, new_control: variation_id });

    } catch (e) {
        next(e);
    }
}
