import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import * as bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: any): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return this.userRepository.save(user) as unknown as Promise<User>;
  }

  async findAll(query: any): Promise<User[]> {
    const { skip = 0, take = 10, role } = query;
    const queryBuilder = this.userRepository.createQueryBuilder("user");

    if (role) {
      queryBuilder.where("user.role = :role", { role });
    }

    return queryBuilder.skip(skip).take(take).getMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: any): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user) as unknown as Promise<User>;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
