import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PokeResponse } from './interfaces/poke-response.interface';
import { Model } from 'mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';

@Injectable()
export class SeedService {
  private readonly axios: AxiosInstance = axios;
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
    private readonly http: AxiosAdapter,
  ) {}
  async runSeed() {
    try {
      await this.pokemonModel.deleteMany({});
      const data = await this.http.get<PokeResponse>(
        'https://pokeapi.co/api/v2/pokemon?limit=650',
      );
      const pokemons = [];
      data.results.forEach(({ name, url }) => {
        const segments = url.split('/');
        const no: number = +segments[segments.length - 2];
        pokemons.push({ name, no });
      });

      await this.pokemonModel.insertMany(pokemons);

      return data.results;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException(`Pokemon already exists in db`);
      }
      console.error(error);
      throw new InternalServerErrorException();
    }
  }
}
