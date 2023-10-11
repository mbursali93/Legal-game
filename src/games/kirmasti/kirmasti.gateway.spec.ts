import { Test, TestingModule } from '@nestjs/testing';
import { KirmastiGateway } from './kirmasti.gateway';

describe('KirmastiGateway', () => {
  let gateway: KirmastiGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KirmastiGateway],
    }).compile();

    gateway = module.get<KirmastiGateway>(KirmastiGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
