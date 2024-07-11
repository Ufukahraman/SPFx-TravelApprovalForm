import * as React from 'react';
import styles from "./Sof.module.scss";
import { BaseButton, DefaultButton } from "@fluentui/react/lib/Button";
import { ISofProps } from "./ISofProps";
import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { MYModal } from './MYModal';

interface IState {
  tlavansdeger: string
  callchildcomponent: boolean;
  rows: IRow[];
}

interface IRow {
  id: number;
  baslangicTarihi: string;
  bitisTarihi: string;
  seyahatEdilecekYer: string;
  masrafTipi: string;
  tutar: string;
  paraBirimi: string;
  aciklama: string;
  odemeSekli: string;
}

export default class Sof extends React.Component<ISofProps, IState> {
  constructor(props: ISofProps, state: any) {
    super(props);

    this.state = {
      callchildcomponent: false,
      tlavansdeger: "",
      rows: [
        {

          id: 1,
          baslangicTarihi: "",
          bitisTarihi: "",
          seyahatEdilecekYer: "",
          masrafTipi: "",
          tutar: "",
          paraBirimi: "",
          aciklama: "",
          odemeSekli: "",
        },
      ],

    };
    this.handler = this.handler.bind(this);
    this.Buttonclick = this.Buttonclick.bind(this);
  }
  handler() {
    this.setState({
      callchildcomponent: false,
    });
  }
  private Buttonclick(
    e: React.MouseEvent<
      | HTMLDivElement
      | HTMLAnchorElement
      | HTMLButtonElement
      | BaseButton
      | DefaultButton
      | HTMLSpanElement,
      MouseEvent
    >
  ) {
    e.preventDefault();
    this.setState({ callchildcomponent: true });
  }
  exportPDF = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const input = document.getElementById("icerik");

      if (!input) {
        console.error('Element with id "Saf" not found');
        reject("Element not found");
        return;
      }

      html2canvas(input, { logging: true, useCORS: true, scale: 2 }).then(
        (canvas) => {
          const imgWidth = 210;
          const imgHeight = 150;

          const pdf = new jsPDF("p", "mm", "a4");
          pdf.addImage(
            canvas.toDataURL("image/jpeg"),
            "JPEG",
            0,
            0,
            imgWidth,
            imgHeight
          );

          const pdfBlob = pdf.output("blob");
          resolve(pdfBlob);
          const pdfFileName = "Saif.pdf";
          pdf.save(pdfFileName);
        }
      );
    });
  };

  addAttachment = async (itemId: number): Promise<void> => {
    try {
      const pdfBlob = await this.exportPDF();
      const fileName = "satinalmaformu.pdf";
      const response = await this.props.context.spHttpClient.post(
        `${this.props.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('seyahatFormuKayitlari')/items(${itemId})/AttachmentFiles/add(FileName='${fileName}')`,
        SPHttpClient.configurations.v1,
        {
          headers: {
            Accept: "application/json;odata=nometadata",
            "Content-type": "application/json;odata=nometadata",
            "odata-version": "",
          },
          body: pdfBlob,
        }
      );



      if (response.ok) {
        console.log("Başarılı");
      }
      else {
        console.error("Ek eklenirken hata oluştu");
      }
    } catch (error) {
      console.error(error);
    }
  };

  private handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    id: number,
    field: string,
    callback?: () => void
  ) => {
    let inputValue = e.target.value;



    // Update the state if the input is valid
    this.setState((prevState: any) => {
      const updatedRows = prevState.rows.map((row: IRow) => {
        if (row.id === id) {

          return this.updateRowField(row, field, inputValue);
        } else {
          return row;
        }
      });

      // Set the state with the updated rows
      return { rows: updatedRows };
    },
      () => {
        this.avansHesapla();
        if (callback) {
          callback();
        }
      }
    );
  };

  private updateRowField = (row: IRow, field: string, value: string) => {
    // Update the specified field in the row
    return {
      ...row,
      [field]: value, 
    };
  };


  //----------------------------------------------------------------------------------------------------
  //Satır Ekle

  private addRow = () => {
    const newRow: IRow = {
      id: this.state.rows.length + 1,
      baslangicTarihi: "",
      bitisTarihi: "",
      seyahatEdilecekYer: "",
      masrafTipi: "",
      tutar: "",
      paraBirimi: "",
      aciklama: "",
      odemeSekli: "",
    };

    this.setState((prevState: any) => ({
      rows: [...prevState.rows, newRow],
    }));
  };

  //----------------------------------------------------------------------------------------------------
  //Satır Sil

  private deleteRow = (callback?: () => void) => {
    const lastRowId = this.state.rows[this.state.rows.length - 1].id;

    // En son eklenen satırı sil
    const updatedRows = this.state.rows.filter(
      (row: IRow) => row.id !== lastRowId
    );


    this.setState({ rows: updatedRows },
      () => {
        this.avansHesapla();
        if (callback) {
          callback();
        }
      }
    );
  };
  private avansHesapla = (): void => {
    const avansSelected = this.state.rows.some((row) => row.odemeSekli === "Avans" && row.paraBirimi);

    if (avansSelected) {
      // Hesaplama: TL, USD, EUR, GBP avans toplamları
      let tlAvansToplam = 0;
      let usdAvansToplam = 0;
      let eurAvansToplam = 0;
      let gbpAvansToplam = 0;

      // Satırları döngüye alarak toplamları hesapla
      this.state.rows.forEach((row) => {
        if (row.odemeSekli === "Avans") {
          switch (row.paraBirimi) {
            case "TL":
              tlAvansToplam += parseFloat(row.tutar.replace(",", ".")) || 0;
              break;
            case "USD":
              usdAvansToplam += parseFloat(row.tutar.replace(",", ".")) || 0;
              break;
            case "EUR":
              eurAvansToplam += parseFloat(row.tutar.replace(",", ".")) || 0;
              break;
            case "GBP":
              gbpAvansToplam += parseFloat(row.tutar.replace(",", ".")) || 0;
              break;
            default:
              break;
          }
        }
      });

      // İlgili input alanlarına toplam değerleri atama
      const tlAvansInput = document.getElementById("tlavans") as HTMLInputElement;
      const usdAvansInput = document.getElementById("usdavans") as HTMLInputElement;
      const eurAvansInput = document.getElementById("euravans") as HTMLInputElement;
      const gbpAvansInput = document.getElementById("gbpavans") as HTMLInputElement;

      tlAvansInput.value = tlAvansToplam.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
      this.setState({ tlavansdeger: tlAvansInput.value });
      usdAvansInput.value = usdAvansToplam.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
      eurAvansInput.value = eurAvansToplam.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
      gbpAvansInput.value = gbpAvansToplam.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    }
  }
  private createItem = (): void => {


    const body: string = JSON.stringify({

      baslangictarihi: this.state.rows.map((row: IRow) => row.id.toString() + ".girdi " + row.baslangicTarihi.toString()).join(",\n"),
      bitistarihi: this.state.rows.map((row: IRow) => row.id.toString() + ".girdi " + row.bitisTarihi.toString()).join(",\n"),
      seyahatedilecekyer: this.state.rows.map((row: IRow) => row.id.toString() + ".girdi " + row.seyahatEdilecekYer.toString()).join(",\n"),
      masraftipi: this.state.rows.map((row: IRow) => row.id.toString() + ".girdi " + row.masrafTipi.toString()).join(",\n"),
      tutar: this.state.rows.map((row: IRow) => row.id.toString() + ".girdi " + row.tutar.toString()).join(",\n"),
      parabirimi: this.state.rows.map((row: IRow) => row.id.toString() + ".girdi " + row.paraBirimi.toString()).join(",\n"),
      aciklama: this.state.rows.map((row: IRow) => row.id.toString() + ".girdi " + row.aciklama.toString()).join(",\n"),
      odemesekli: this.state.rows.map((row: IRow) => row.id.toString() + ".girdi " + row.odemeSekli.toString()).join(",\n"),





    });
    this.props.context.spHttpClient
      .post(
        `${this.props.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('seyahatFormuKayitlari')/items`,
        SPHttpClient.configurations.v1,
        {
          headers: {
            Accept: "application/json;odata=nometadata",
            "Content-type": "application/json;odata=nometadata",
            "odata-version": "",
          },
          body: body,
        }
      )
      .then((response: SPHttpClientResponse) => {
        if (response.ok) {
          response.json().then((responseJSON) => {
            const newItemId: number = responseJSON.Id;

            // Yeni oluşturulan öğeye ek dosya ekleyin
            this.addAttachment(newItemId);
            console.log(responseJSON);

            setTimeout(function () {
              alert(
                "Formunuz başarıyla gönderildi. Sayfa 5 saniye içinde yenilenecek..."
              );
              window.location.reload();
            }, 5000);
          });
        } else {
        }
      })

      .catch((error: any) => {
        console.log(error);
      });
  };

  public render(): React.ReactElement<ISofProps> {


    return (
      <div>
        <DefaultButton
          onClick={(e) => this.Buttonclick(e)}
          text="Seyahat Formu İçin Tıklayınız"
          className={styles.customGirisButton}
        /> 
        {this.state.callchildcomponent && (
          <MYModal handler={() => console.log("Modal kapatıldı")}> 
            <div className={styles.custom} id="Sof">
              <div className={styles.container} id="icerik">
                <div className={styles.row}>
                  <div className={styles.column}>
                    <table className={styles.table} id="Giriş">
                      <thead>
                        <tr>
                          <th colSpan={20} className={styles.th}>
                            PANÇO GİYİM SANAYİ VE TİCARET A.Ş <br />
                            SEYAHAT MASRAF FORMU
                          </th>
                        </tr>

                      </thead> 
                      <tbody>
                        <tr>
                          <td colSpan={8}>
                            <button
                              className={styles.customAddButton}
                              onClick={() => this.addRow()}
                            >
                              Satır Ekle
                            </button>

                            <button
                              className={styles.customDeleteButton}
                              onClick={() => this.deleteRow()}
                            >
                              Satır Sil
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <th colSpan={1}>Başlangıç Tarihi</th>
                          <th colSpan={1}>Bitiş Tarih</th>
                          <th colSpan={1}>Seyahat Edilecek Yer</th>
                          <th colSpan={1}>Masraf Tipi</th>
                          <th colSpan={1}>Tutar/ Orijinal Para Birimi</th>
                          <th colSpan={1}>Para Birimi</th>
                          <th colSpan={1}>Açıklama</th>
                          <th colSpan={1}>Ödeme Şekli</th>
                        </tr>
                        {this.state.rows.map((row: IRow) => (
                          <tr key={row.id} className={styles.tarow2}>
                            <td colSpan={1}>
                              <input
                                className={styles.input}

                                id="baslangictarihi"
                                type="date"
                                value={row.baslangicTarihi}
                                onChange={(e) =>
                                  this.handleInputChange(e, row.id, "baslangicTarihi")
                                }
                              />
                            </td>
                            <td colSpan={1}>
                              <input
                                className={styles.input}
                                id="bitistarihi"
                                type="date"
                                value={row.bitisTarihi}
                                onChange={(e) =>
                                  this.handleInputChange(e, row.id, "bitisTarihi")
                                }
                              />
                            </td>
                            <td colSpan={1}>
                              <input

                                className={styles.input}
                                id="seyahatedilecekyer"
                                value={row.seyahatEdilecekYer}
                                onChange={(e) =>
                                  this.handleInputChange(e, row.id, "seyahatEdilecekYer")
                                }
                              />
                            </td>
                            <td colSpan={1}>
                              <select
                                className={styles.input}
                                id="masraftipi"

                                value={row.masrafTipi}
                                onChange={(e) =>
                                  this.handleInputChange(e, row.id, "masrafTipi")
                                }
                              >
                                <option value="Seçiniz">Seçiniz</option>
                                <option value="Otobüs Bileti">Otobüs Bileti</option>
                                <option value="Otopark Bedeli">Otopark Bedeli</option>
                                <option value="Pasaport Danışmanlık Bedeli">Pasaport Danışmanlık Bedeli</option>
                                <option value="Uçak Bileti Gidiş-Dönüş">Uçak Bileti Gidiş-Dönüş</option>
                                <option value="Yurtdışı Çıkış Harcırahı">Yurtdışı Çıkış Harcırahı</option>
                                <option value="Tren Bedeli">Tren Bedeli</option>
                                <option value="Konaklama">Konaklama</option>
                                <option value="Numune Bedeli">Numune Bedeli</option>
                                <option value="Yemek">Yemek</option>
                                <option value="Taksi">Taksi</option>
                                <option value="Diğer">Diğer</option>

                              </select>
                            </td>
                            <td colSpan={1}>
                              <input
                                className={styles.input}
                                id="tutar"
                                value={row.tutar}
                                onChange={(e) =>
                                  this.handleInputChange(e, row.id, "tutar")
                                }
                              />
                            </td>
                            <td colSpan={1}>
                              <select
                                className={styles.input}
                                id="parabirimi"
                                defaultValue={"TL"}
                                value={row.paraBirimi}
                                onChange={(e) =>
                                  this.handleInputChange(e, row.id, "paraBirimi")
                                }
                              >
                                <option value="Seçiniz">Seçiniz</option>
                                <option value="TL">TL(₺)</option>
                                <option value="USD">USD($)</option>
                                <option value="EUR">EUR(€)</option>
                                <option value="GBP">GBP(£)</option>
                              </select>
                            </td>
                            <td colSpan={1}>
                              <input
                                type='select'
                                className={styles.input}
                                id="aciklama"
                                value={row.aciklama}
                                onChange={(e) =>
                                  this.handleInputChange(e, row.id, "aciklama")
                                }
                              />
                            </td>
                            <td colSpan={1}>
                              <select
                                className={styles.input}
                                id="odemesekli"

                                value={row.odemeSekli}
                                onChange={(e) =>
                                  this.handleInputChange(e, row.id, "odemeSekli")
                                }
                              >
                                <option value="Seçiniz">Seçiniz</option>
                                <option value="Şirket Kredi Kartı ile ödeme">Şirket Kredi Kartı ile ödeme</option>
                                <option value="Fatura ile ödeme">Fatura ile ödeme</option>
                                <option value="Avans">Avans</option>

                              </select>
                            </td>
                          </tr>

                        ))}


                      </tbody>

                    </table>
                    <table className={styles.table} id="Avans">
                      <thead>
                        <th colSpan={4}>Avans istenilen Para Birimi</th>
                        <th colSpan={2}> TL</th>
                        <th colSpan={2}> USD </th>
                        <th colSpan={2}> EUR </th>
                        <th colSpan={2}> GBP </th>
                      </thead>
                      <tbody>
                        <tr className={styles.tarow}>
                          <th colSpan={4}>Avans İstenilen Tutar</th>
                          <td colSpan={2}>
                            <input
                              className={styles.input}
                              type="text"
                              id="tlavans"
                              value={this.state.tlavansdeger}

                            />
                          </td>
                          <td colSpan={2}>
                            <input
                              className={styles.input}
                              type="text"
                              id="usdavans"

                            />
                          </td>
                          <td colSpan={2}>
                            <input
                              className={styles.input}
                              type="text"
                              id="euravans"

                            />

                          </td>
                          <td colSpan={2}>
                            <input
                              className={styles.input}
                              type="text"
                              id="gbpavans"

                            />
                          </td>
                        </tr>




                      </tbody>
                    </table>
                  </div>

                </div>

              </div>
              <table className={styles.table}>
                <tbody>
                  <tr>
                    <td>
                      <button
                        className={styles.customSubmitButton}
                        onClick={this.createItem}
                      >
                        Gönder
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </MYModal>
        )}
      </div>

    );
  }
}
