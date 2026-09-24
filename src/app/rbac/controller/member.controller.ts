import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { tokens } from '../../../lib/di/tokens';
import { sendSuccess } from '../../../lib/http/response';
import { validateBody } from '../../../lib/validation/validate';
import { CreateMemberDTO, UpdateMemberDTO } from '../dto/member.dto';
import { MemberService } from '../service/member.service';

@injectable()
export class MemberController {
  constructor(@inject(tokens.MemberService) private readonly memberService: MemberService) {}

  listMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = Number(req.params.restaurantId);
      const result = await this.memberService.listMembers(restaurantId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = Number(req.params.restaurantId);
      const data = await validateBody(CreateMemberDTO, req.body);
      const result = await this.memberService.createMember(restaurantId, data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = Number(req.params.restaurantId);
      const memberId = Number(req.params.memberId);
      const data = await validateBody(UpdateMemberDTO, req.body);
      const result = await this.memberService.updateMember(restaurantId, memberId, data);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  deleteMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const restaurantId = Number(req.params.restaurantId);
      const memberId = Number(req.params.memberId);
      const result = await this.memberService.deleteMember(memberId, restaurantId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}
